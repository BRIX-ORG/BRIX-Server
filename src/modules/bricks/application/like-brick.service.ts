import { Injectable, NotFoundException } from '@nestjs/common';
import { BrickRepository } from '../infrastructure';
import { VoteRepository, VoteResult } from '../infrastructure/vote.repository';
import { NotificationBatchService } from '@/modules/notifications/application';
import { NotificationType } from '@prisma/client';

@Injectable()
export class LikeBrickService {
    constructor(
        private readonly voteRepository: VoteRepository,
        private readonly brickRepository: BrickRepository,
        private readonly notificationBatchService: NotificationBatchService,
    ) {}

    async execute(brickId: string, userId: string): Promise<VoteResult> {
        const brick = await this.brickRepository.findById(brickId);
        if (!brick) throw new NotFoundException('Brick not found');

        const result = await this.voteRepository.toggleLike(brickId, userId);

        // Only notify when liking (not unliking), and not self-like
        if (result.liked && brick.userId !== userId) {
            await this.notificationBatchService.addNotification({
                type: NotificationType.LIKE_BRICK,
                recipientId: brick.userId,
                actorId: userId,
                brickId,
            });
        }

        return result;
    }
}
