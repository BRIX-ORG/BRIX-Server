import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@/prisma';
import { RedisService } from '@/redis';
import { MinioService } from '@/minio';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private prismaHealth: PrismaHealthIndicator,
        private prisma: PrismaService,
        private redisService: RedisService,
        private minioService: MinioService,
    ) {}

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Check application health' })
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
