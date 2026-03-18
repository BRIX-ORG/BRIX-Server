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
    namespace: '/onchain',
})
export class OnchainGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(OnchainGateway.name);

    constructor(private readonly jwtService: JwtService) {}

    handleConnection(client: Socket) {
        try {
            const token =
                (client.handshake.auth?.token as string | undefined) ??
                (client.handshake.query?.token as string | undefined);

            if (!token) {
                this.logger.warn(`[Onchain] Client ${client.id} rejected: no token`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify<JwtPayload>(token);
            const userId = payload.sub;
            (client as AuthenticatedSocket).data.userId = userId;

            void client.join(`user:${userId}`);

            this.logger.log(`[Onchain] Client connected: ${client.id} (user: ${userId})`);
        } catch {
            this.logger.warn(`[Onchain] Client ${client.id} rejected: invalid token`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = (client as AuthenticatedSocket).data?.userId;
        this.logger.log(`[Onchain] Client disconnected: ${client.id} (user: ${userId})`);
    }

    /**
     * Notify frontend that a brick has been successfully distributed to IPFS
     */
    emitIpfsUploaded(
        userId: string,
        data: { brickId: string; imageCid: string; ipfsCid: string; hashSha256: string },
    ) {
        this.server.to(`user:${userId}`).emit('ipfs_uploaded', data);
    }

    /**
     * Notify frontend that a brick has been successfully minted on chain
     */
    emitBrickMinted(userId: string, data: { brickId: string; txHash: string }) {
        this.server.to(`user:${userId}`).emit('brick_minted', data);
    }
}
