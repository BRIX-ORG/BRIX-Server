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
import { PrismaService } from '@/prisma/prisma.service';
import { MessageResponseDto } from '@messages/dto';
import { MessageReactions } from '@messages/domain';

interface JwtPayload {
    sub: string;
    email: string;
    iat: number;
    exp: number;
}

interface AuthenticatedSocket extends Socket {
    data: {
        userId: string;
    };
}

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/chat',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(SocketGateway.name);

    /** Map of userId → Set<socketId> (one user can have multiple connections) */
    private readonly onlineUsers = new Map<string, Set<string>>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
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

            // Track online
            if (!this.onlineUsers.has(userId)) {
                this.onlineUsers.set(userId, new Set());
            }
            this.onlineUsers.get(userId)!.add(client.id);

            // Update user online status
            await this.prisma.user.update({
                where: { id: userId },
                data: { isOnline: true },
            });

            this.server.emit('userOnline', { userId });
            this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
        } catch {
            this.logger.warn(`Client ${client.id} disconnected: invalid token`);
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = (client as AuthenticatedSocket).data.userId;
        if (!userId) return;

        const sockets = this.onlineUsers.get(userId);
        if (sockets) {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.onlineUsers.delete(userId);

                // Update user offline status
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { isOnline: false, lastSeenAt: new Date() },
                });

                this.server.emit('userOffline', { userId, lastSeenAt: new Date() });
            }
        }

        this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
    }

    // ─── Room Management ──────────────────────────────────────────────────────

    @SubscribeMessage('joinConversation')
    handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        void client.join(`conversation:${data.conversationId}`);
        this.logger.debug(
            `${(client as AuthenticatedSocket).data.userId} joined conversation:${data.conversationId}`,
        );
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
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = (client as AuthenticatedSocket).data.userId;
        client.to(`conversation:${data.conversationId}`).emit('typing', {
            userId,
            conversationId: data.conversationId,
        });
    }

    @SubscribeMessage('stopTyping')
    handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = (client as AuthenticatedSocket).data.userId;
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
