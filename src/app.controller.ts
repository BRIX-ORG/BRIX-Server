import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from '@nestjs/terminus';
import { AppService } from '@/app.service';
import { PrismaService } from '@/prisma';
import { RedisService } from '@/redis';
import { MinioService } from '@/minio';

@ApiTags('System')
@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private health: HealthCheckService,
        private prismaHealth: PrismaHealthIndicator,
        private prisma: PrismaService,
        private redisService: RedisService,
        private minioService: MinioService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'API Root Information' })
    @ApiResponse({
        status: 200,
        description: 'Returns basic API metadata',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Success' },
                code: { type: 'number', example: 200 },
                data: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'BRIX API' },
                        version: { type: 'string', example: '1.0.0' },
                        description: { type: 'string', example: 'BRIX Server API' },
                        docs: { type: 'string', example: '/api/docs' },
                        health: { type: 'string', example: '/api/health' },
                    },
                },
            },
        },
    })
    getHello() {
        return this.appService.getHello();
    }

    @Get('health')
    @HealthCheck()
    @ApiOperation({ summary: 'Check API health status' })
    check() {
        return this.health.check([
            () => this.prismaHealth.pingCheck('database', this.prisma),
            async () => {
                try {
                    const client = this.redisService.getClient();
                    await client.ping();
                    return { redis: { status: 'up' } };
                } catch (e) {
                    const message = e instanceof Error ? e.message : String(e);
                    return { redis: { status: 'down', message } };
                }
            },
            async () => {
                try {
                    await this.minioService
                        .getClient()
                        .bucketExists('health-check-dummy')
                        .catch(() => true);
                    return { minio: { status: 'up' } };
                } catch (e) {
                    const message = e instanceof Error ? e.message : String(e);
                    return { minio: { status: 'down', message } };
                }
            },
        ]);
    }
}
