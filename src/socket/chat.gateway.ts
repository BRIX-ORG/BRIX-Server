import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma';
import { MessageResponseDto } from '@messages/dto';
import { MessageReactions } from '@messages/domain';
import { RedisService } from '@/redis';
import { JwtPayload, AuthenticatedSocket } from './socket.types';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    private readonly ONLINE_USERS_KEY_PREFIX = 'user:online:';
    private readonly TYPING_KEY_PREFIX = 'conversation:typing:';
    private readonly USER_TYPING_CONVERSATIONS_PREFIX = 'user:typing:convs:';
    private readonly TYPING_TTL = 5000;

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) {}

    // ─── Connection Lifecycle ─────────────────────────────────────────────────

    async handleConnection(client: Socket) {
        try {
            const token =
                (client.handshake.auth?.token as string | undefined) ??
                (client.handshake.query?.token as string | undefined);

            if (!token) {
                this.logger.warn(`Client ${client.id} disconnected: no token`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify<JwtPayload>(token);
            const userId = payload.sub;
            (client as AuthenticatedSocket).data.userId = userId;

            // Track online in Redis
            const userKey = `${this.ONLINE_USERS_KEY_PREFIX}${userId}`;
            const countBefore = await this.redisService.sCard(userKey);
            await this.redisService.sAdd(userKey, client.id);

            // Update user online status in DB if this is the first connection
            if (countBefore === 0) {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { isOnline: true },
                });
                this.server.emit('userOnline', { userId });
            }

            this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
        } catch {
            this.logger.warn(`Client ${client.id} disconnected: invalid token`);
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = (client as AuthenticatedSocket).data?.userId;
        if (!userId) return;

        const userKey = `${this.ONLINE_USERS_KEY_PREFIX}${userId}`;
        await this.redisService.sRem(userKey, client.id);
        const countAfter = await this.redisService.sCard(userKey);

        if (countAfter === 0) {
            const lastSeenAt = new Date();
            // Update user offline status in DB if no more connections
            await this.prisma.user.update({
                where: { id: userId },
                data: { isOnline: false, lastSeenAt },
            });

            this.server.emit('userOffline', { userId, lastSeenAt });
        }

        // Cleanup typing status on disconnect using per-user tracking (O(N) safe)
        const userTypingKey = `${this.USER_TYPING_CONVERSATIONS_PREFIX}${userId}`;
        const typingConvs = await this.redisService.sMembers(userTypingKey);

        for (const convId of typingConvs) {
            const typingKey = `${this.TYPING_KEY_PREFIX}${convId}`;
            await this.redisService.zRem(typingKey, userId);
        }
        await this.redisService.delete(userTypingKey);

        this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
    }

    // ─── Room Management ──────────────────────────────────────────────────────

    @SubscribeMessage('joinConversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = (client as AuthenticatedSocket).data.userId;
        void client.join(`conversation:${data.conversationId}`);

        // Send existing typing users to the joiner
        const typingKey = `${this.TYPING_KEY_PREFIX}${data.conversationId}`;
        const now = Date.now();
        // Remove expired typing users first
        await this.redisService.zRemRangeByScore(typingKey, '-inf', now);
        const typingUsers = await this.redisService.zRangeByScore(typingKey, now, '+inf');

        if (typingUsers.length > 0) {
            client.emit('typingList', {
                conversationId: data.conversationId,
                users: typingUsers,
            });
        }

        this.logger.debug(`${userId} joined conversation:${data.conversationId}`);
    }

    @SubscribeMessage('leaveConversation')
    handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        void client.leave(`conversation:${data.conversationId}`);
        this.logger.debug(
            `${(client as AuthenticatedSocket).data.userId} left conversation:${data.conversationId}`,
        );
    }

    // ─── Typing Indicators ────────────────────────────────────────────────────

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = (client as AuthenticatedSocket).data.userId;
        const typingKey = `${this.TYPING_KEY_PREFIX}${data.conversationId}`;

        // Set typing status with TTL
        await this.redisService.zAdd(typingKey, Date.now() + this.TYPING_TTL, userId);

        // Track that this user is typing in this conversation
        const userTypingKey = `${this.USER_TYPING_CONVERSATIONS_PREFIX}${userId}`;
        await this.redisService.sAdd(userTypingKey, data.conversationId);
        await this.redisService.expire(userTypingKey, 3600); // Safety TTL

        client.to(`conversation:${data.conversationId}`).emit('typing', {
            userId,
            conversationId: data.conversationId,
        });
    }

    @SubscribeMessage('stopTyping')
    async handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = (client as AuthenticatedSocket).data.userId;
        const typingKey = `${this.TYPING_KEY_PREFIX}${data.conversationId}`;

        await this.redisService.zRem(typingKey, userId);

        // Remove from per-user tracking
        const userTypingKey = `${this.USER_TYPING_CONVERSATIONS_PREFIX}${userId}`;
        await this.redisService.sRem(userTypingKey, data.conversationId);

        client.to(`conversation:${data.conversationId}`).emit('stopTyping', {
            userId,
            conversationId: data.conversationId,
        });
    }

    // ─── Server-side Emitters (called by services) ────────────────────────────

    emitNewMessage(conversationId: string, message: MessageResponseDto) {
        this.server.to(`conversation:${conversationId}`).emit('newMessage', message);
    }

    emitMessageUpdated(conversationId: string, message: MessageResponseDto) {
        this.server.to(`conversation:${conversationId}`).emit('messageUpdated', message);
    }

    emitMessageDeleted(conversationId: string, messageId: string) {
        this.server
            .to(`conversation:${conversationId}`)
            .emit('messageDeleted', { messageId, conversationId });
    }

    emitMessageReaction(
        conversationId: string,
        messageId: string,
        reactions: MessageReactions | null,
    ) {
        this.server
            .to(`conversation:${conversationId}`)
            .emit('messageReaction', { messageId, conversationId, reactions });
    }

    emitMessagesRead(conversationId: string, readerId: string) {
        this.server
            .to(`conversation:${conversationId}`)
            .emit('messagesRead', { conversationId, readerId });
    }
}
