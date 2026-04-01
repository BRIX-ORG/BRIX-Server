import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Optional } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { NotificationRepository } from '@/modules/notifications/infrastructure/notification.repository';
import { NotificationFlushData } from '@/queue/types';
import { NotificationGateway } from '@/socket/notification.gateway';

@Processor('notifications', {
    concurrency: 10,
})
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly notificationRepository: NotificationRepository,
        @Optional() private readonly notificationGateway?: NotificationGateway,
    ) {
        super();
    }

    async process(job: Job<NotificationFlushData, any, string>): Promise<any> {
        if (job.name === 'flush-notification') {
            await this.handleNotificationFlush(job.data);
        }
    }

    private async handleNotificationFlush(data: NotificationFlushData) {
        const { type, recipientId, brickId, commentId, groupId } = data;

        const baseKey =
            data.baseKey ||
            `notif:${type}:${recipientId}:${brickId ?? 'null'}:${commentId ?? 'null'}`;
        const batchKey = `${baseKey}:batch`;
        const actorsKey = `${baseKey}:actors`;

        // 1. Read Redis Batch
        const [batchData, actorIds] = await Promise.all([
            this.redisService.hGetAll(batchKey),
            this.redisService.sMembers(actorsKey),
        ]);

        if (!batchData || Object.keys(batchData).length === 0) {
            this.logger.debug(`No batch data found for key: ${batchKey}`);
            return;
        }

        const actorsCount = parseInt(batchData.actors_count, 10);
        const lastActorId = batchData.last_actor_id;

        // 2. Database Flush
        let updatedGroup: Awaited<
            ReturnType<typeof this.notificationRepository.incrementGroup>
        > | null = null;

        if (groupId) {
            updatedGroup = await this.notificationRepository.incrementGroup(groupId, {
                delta: actorsCount,
                lastActorId,
            });
            await this.notificationRepository.addActors(groupId, actorIds);
            this.logger.log(`Notification group ${groupId} incremented by ${actorsCount} actors`);
        } else {
            const group = await this.notificationRepository.findGroup(
                recipientId,
                type,
                brickId,
                commentId,
            );

            if (group) {
                updatedGroup = await this.notificationRepository.incrementGroup(group.id, {
                    delta: actorsCount,
                    lastActorId,
                });
                await this.notificationRepository.addActors(group.id, actorIds);
                this.logger.log(`Notification flushed via fallback lookup: ${group.id}`);
            } else {
                this.logger.error(
                    `No groupId and no existing group found for flush: ${baseKey}. Skipping.`,
                );
                return;
            }
        }

        // 3. Push real-time update to recipient
        if (updatedGroup) {
            this.notificationGateway?.emitNotificationUpdated(recipientId, {
                id: updatedGroup.id,
                actorsCount: updatedGroup.actorsCount,
                lastActorId: updatedGroup.lastActorId,
                lastActor: updatedGroup.lastActor,
                brick: updatedGroup.brick,
                comment: updatedGroup.comment,
            });
        }

        // 4. Cleanup Redis Batch
        await Promise.all([
            this.redisService.delete(batchKey),
            this.redisService.delete(actorsKey),
        ]);
    }
}
