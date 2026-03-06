import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationRepository } from './infrastructure';
import {
    NotificationBatchService,
    GetNotificationsService,
    GetUnreadNotificationCountService,
    ReadNotificationService,
    ReadAllNotificationsService,
    DeleteNotificationService,
} from './application';

import { RedisModule } from '@redis/redis.module';
import { QueueModule } from '@/queue/queue.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'notifications',
        }),
        RedisModule,
        forwardRef(() => QueueModule),
    ],
    controllers: [NotificationsController],
    providers: [
        NotificationRepository,
        NotificationBatchService,
        GetNotificationsService,
        GetUnreadNotificationCountService,
        ReadNotificationService,
        ReadAllNotificationsService,
        DeleteNotificationService,
    ],
    exports: [NotificationBatchService, NotificationRepository],
})
export class NotificationsModule {}
