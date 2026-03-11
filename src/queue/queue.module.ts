import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import {
    EmailProcessor,
    NotificationProcessor,
    BrickDescriptionProcessor,
    PhotoUploadProcessor,
    AlgoliaProcessor,
} from './processors';
import { EmailModule } from '@/email';
import { forwardRef } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { PrismaModule } from '@/prisma';
import { CloudinaryModule } from '@/cloudinary';
import { MinioModule } from '@/minio';
import { AlgoliaModule } from '@/algolia';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                    password: configService.get<string>('REDIS_PASSWORD'),
                    db: configService.get<number>('REDIS_DB', 0),
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: {
                        count: 100, // Keep last 100 completed jobs
                        age: 3600, // Keep completed jobs for 1 hour
                    },
                    removeOnFail: {
                        count: 500, // Keep last 500 failed jobs for debugging
                    },
                },
            }),
        }),
        BullModule.registerQueue({
            name: 'email',
        }),
        BullModule.registerQueue({
            name: 'notifications',
        }),
        BullModule.registerQueue({
            name: 'brick-description',
        }),
        BullModule.registerQueue({
            name: 'photo-upload',
        }),
        BullModule.registerQueue({
            name: 'algolia',
        }),
        EmailModule,
        PrismaModule,
        CloudinaryModule,
        MinioModule,
        AlgoliaModule,
        forwardRef(() => NotificationsModule),
    ],
    providers: [
        QueueService,
        EmailProcessor,
        NotificationProcessor,
        BrickDescriptionProcessor,
        PhotoUploadProcessor,
        AlgoliaProcessor,
    ],
    exports: [QueueService],
})
export class QueueModule {}
