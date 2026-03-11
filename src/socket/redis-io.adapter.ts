import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from '@/redis';
import { INestApplicationContext } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
    constructor(
        appOrHttpServer: INestApplicationContext,
        private readonly redisService: RedisService,
    ) {
        super(appOrHttpServer);
    }

    createIOServer(port: number, options?: ServerOptions): Server {
        const server = super.createIOServer(port, options) as Server;
        const pubClient = this.redisService.getClient();
        const subClient = pubClient.duplicate();

        // Explicitly connect the subClient as requested
        subClient.connect().catch((err) => {
            console.error('Redis subClient connection failed', err);
        });

        const redisAdapter = createAdapter(pubClient, subClient);
        server.adapter(redisAdapter);
        return server;
    }
}
