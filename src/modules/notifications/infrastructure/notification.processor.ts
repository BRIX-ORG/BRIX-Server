import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { NotificationRepository } from './notification.repository';
import { NotificationType } from '@prisma/client';
import { NotificationFlushData } from '../domain';

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

    private async handleNotificationFlush(data: {
        type: NotificationType;
        recipientId: string;
        brickId?: string;
        commentId?: string;
        groupId?: string;
    }) {
        const { type, recipientId, brickId, commentId, groupId } = data;

        const baseKey = `notif:${type}:${recipientId}:${brickId ?? 'null'}:${commentId ?? 'null'}`;
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
            // Update existing group (The "Instant First" strategy)
            await this.notificationRepository.updateGroup(groupId, {
                actorsCount,
                lastActorId,
            });

            // Add actors (idempotent)
            await this.notificationRepository.addActors(groupId, actorIds);

            this.logger.log(`Notification group ${groupId} updated with ${actorsCount} new actors`);
        } else {
            // Fallback: UPSERT Strategy (if groupId is missing for some reason)
            let group = await this.notificationRepository.findGroup(
                recipientId,
                type,
                brickId,
                commentId,
            );

            if (group) {
                await this.notificationRepository.updateGroup(group.id, {
                    actorsCount,
                    lastActorId,
                });
            } else {
                group = await this.notificationRepository.createGroup({
                    recipientId,
                    type,
                    brickId,
                    commentId,
                    actorsCount,
                    lastActorId,
                });
            }
            await this.notificationRepository.addActors(group.id, actorIds);
            this.logger.log(`Notification flushed to DB via fallback UPSERT: ${group.id}`);
        }

        // 3. Cleanup Redis Batch
        await Promise.all([
            this.redisService.delete(batchKey),
            this.redisService.delete(actorsKey),
        ]);
    }
}
