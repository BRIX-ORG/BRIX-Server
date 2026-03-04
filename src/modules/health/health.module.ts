import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '@/prisma';
import { RedisModule } from '@/redis';
import { MinioModule } from '@/minio';

@Module({
    imports: [TerminusModule, PrismaModule, RedisModule, MinioModule],
    controllers: [HealthController],
})
export class HealthModule {}
