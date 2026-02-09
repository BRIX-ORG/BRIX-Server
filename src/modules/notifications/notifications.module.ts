import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationRepository } from './infrastructure';
import {
    NotificationBatchService,
    GetNotificationsService,
    ReadNotificationService,
    DeleteNotificationService,
} from './application';
import { NotificationProcessor } from './infrastructure/notification.processor';
import { RedisModule } from '@redis/redis.module';
import { QueueModule } from '@/queue/queue.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'notifications',
        }),
        RedisModule,
        QueueModule,
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationRepository,
        NotificationBatchService,
        GetNotificationsService,
        ReadNotificationService,
        DeleteNotificationService,
        NotificationProcessor,
    ],
    exports: [NotificationBatchService],
})
export class NotificationsModule {}
