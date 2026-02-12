import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { NotificationRepository } from '@/modules/notifications/infrastructure/notification.repository';
import { NotificationFlushData } from '@/queue/types';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly notificationRepository: NotificationRepository,
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

        // Use provided baseKey or construct it (fallback for backward compatibility if any old jobs exist)
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
        if (groupId) {
            // Atomic increment (retry-safe, race-safe)
            await this.notificationRepository.incrementGroup(groupId, {
                delta: actorsCount,
                lastActorId,
            });

            // Add actors (idempotent via UNIQUE constraint)
            await this.notificationRepository.addActors(groupId, actorIds);

            this.logger.log(`Notification group ${groupId} incremented by ${actorsCount} actors`);
        } else {
            // Fallback: find group by window parameters
            const group = await this.notificationRepository.findGroup(
                recipientId,
                type,
                brickId,
                commentId,
            );

            if (group) {
                await this.notificationRepository.incrementGroup(group.id, {
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

        // 3. Cleanup Redis Batch
        await Promise.all([
            this.redisService.delete(batchKey),
            this.redisService.delete(actorsKey),
        ]);
    }
}
