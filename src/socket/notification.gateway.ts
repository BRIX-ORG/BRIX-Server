import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, AuthenticatedSocket } from './socket.types';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);

    constructor(private readonly jwtService: JwtService) {}

    // ─── Connection Lifecycle ─────────────────────────────────────────────────

    handleConnection(client: Socket) {
        try {
            const token =
                (client.handshake.auth?.token as string | undefined) ??
                (client.handshake.query?.token as string | undefined);

            if (!token) {
                this.logger.warn(`[Notifications] Client ${client.id} rejected: no token`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify<JwtPayload>(token);
            const userId = payload.sub;
            (client as AuthenticatedSocket).data.userId = userId;

            // Join personal room keyed by userId
            void client.join(`user:${userId}`);

            this.logger.log(`[Notifications] Client connected: ${client.id} (user: ${userId})`);
        } catch {
            this.logger.warn(`[Notifications] Client ${client.id} rejected: invalid token`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = (client as AuthenticatedSocket).data?.userId;
        this.logger.log(`[Notifications] Client disconnected: ${client.id} (user: ${userId})`);
    }

    // ─── Server-side Emitters (called by services) ────────────────────────────

    /**
     * Push a brand-new notification group to the recipient in real time.
     * Called by NotificationBatchService after createGroup (first actor).
     */
    emitNewNotification(recipientId: string, notification: Record<string, any>) {
        this.server.to(`user:${recipientId}`).emit('notification', notification);
    }

    /**
     * Push an update to an existing notification group (batched actors).
     * Called by NotificationProcessor after incrementGroup flush.
     */
    emitNotificationUpdated(
        recipientId: string,
        data: {
            id: string;
            actorsCount: number;
            lastActorId: string;
            lastActor?: any;
            brick?: any;
            comment?: any;
        },
    ) {
        this.server.to(`user:${recipientId}`).emit('notificationUpdated', data);
    }

    /**
     * Push current unread count to the recipient.
     * Called after any notification state change (new / mark read / mark all read).
     */
    emitUnreadCount(recipientId: string, count: number) {
        this.server.to(`user:${recipientId}`).emit('unreadCount', { count });
    }
}
