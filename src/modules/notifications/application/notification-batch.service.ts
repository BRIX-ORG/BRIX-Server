import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { QueueService } from '@/queue/queue.service';
import { NotificationType } from '@prisma/client';
import { NotificationRepository } from '../infrastructure/notification.repository';

@Injectable()
export class NotificationBatchService {
    private readonly logger = new Logger(NotificationBatchService.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly queueService: QueueService,
        private readonly notificationRepository: NotificationRepository,
    ) {}

    async addNotification(data: {
        type: NotificationType;
        recipientId: string;
        actorId: string;
        brickId?: string;
        commentId?: string;
    }): Promise<void> {
        const { type, recipientId, actorId, brickId, commentId } = data;

        const baseKey = `notif:${type}:${recipientId}:${brickId ?? 'null'}:${commentId ?? 'null'}`;
        const windowKey = `${baseKey}:window`;
        const batchKey = `${baseKey}:batch`;
        const actorsKey = `${baseKey}:actors`;

        // Check if a window is already active
        const existingGroupId = await this.redisService.get<string>(windowKey);

        if (existingGroupId) {
            // 2. Window active -> Batch in Redis
            await Promise.all([
                this.redisService.hIncrBy(batchKey, 'actors_count', 1),
                this.redisService.hSet(batchKey, 'last_actor_id', actorId),
                this.redisService.sAdd(actorsKey, actorId),
                this.redisService.expire(batchKey, 12 * 60), // Buffer for safety
                this.redisService.expire(actorsKey, 12 * 60),
            ]);

            // Enqueue BullMQ delayed job for flushing
            await this.queueService.addNotificationFlushJob(
                type,
                recipientId,
                brickId,
                commentId,
                existingGroupId,
            );

            this.logger.log(`Notification batched in Redis for group ${existingGroupId}`);
        } else {
            // 1. New window -> Instant DB delivery for the first actor
            const group = await this.notificationRepository.createGroup({
                recipientId,
                type,
                brickId,
                commentId,
                actorsCount: 1,
                lastActorId: actorId,
            });
            await this.notificationRepository.addActors(group.id, [actorId]);

            // Mark window as active in Redis (10 minutes)
            await this.redisService.set(windowKey, group.id, 10 * 60);

            this.logger.log(`Notification delivered instantly, window started: ${group.id}`);
        }
    }
}
