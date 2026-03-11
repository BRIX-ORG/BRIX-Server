import { Injectable, Logger, Optional, Inject, forwardRef } from '@nestjs/common';
import { RedisService } from '@/redis';
import { QueueService } from '@/queue';
import { NotificationType } from '@prisma/client';
import { NotificationRepository } from '@notifications/infrastructure';
import { NotificationGateway } from '@/socket';

@Injectable()
export class NotificationBatchService {
    private readonly logger = new Logger(NotificationBatchService.name);

    constructor(
        private readonly redisService: RedisService,
        @Inject(forwardRef(() => QueueService))
        private readonly queueService: QueueService,
        private readonly notificationRepository: NotificationRepository,
        @Optional() private readonly notificationGateway?: NotificationGateway,
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

        const existingGroupId = await this.redisService.get<string>(windowKey);

        if (existingGroupId) {
            // Window active → Batch in Redis
            await Promise.all([
                this.redisService.hIncrBy(batchKey, 'actors_count', 1),
                this.redisService.hSet(batchKey, 'last_actor_id', actorId),
                this.redisService.sAdd(actorsKey, actorId),
                this.redisService.expire(batchKey, 12 * 60),
                this.redisService.expire(actorsKey, 12 * 60),
            ]);

            await this.queueService.addNotificationFlushJob(
                type,
                recipientId,
                brickId,
                commentId,
                existingGroupId,
            );

            this.logger.log(`Notification batched in Redis for group ${existingGroupId}`);
        } else {
            // New window → Instant DB delivery for the first actor
            const group = await this.notificationRepository.createGroup({
                recipientId,
                type,
                brickId,
                commentId,
                actorsCount: 1,
                lastActorId: actorId,
            });
            await this.notificationRepository.addActors(group.id, [actorId]);

            // Push real-time notification to recipient
            this.notificationGateway?.emitNewNotification(recipientId, group);

            // Mark window as active in Redis (10 minutes)
            await this.redisService.set(windowKey, group.id, 10 * 60);

            this.logger.log(`Notification delivered instantly, window started: ${group.id}`);
        }
    }
}
