import { Injectable, NotFoundException } from '@nestjs/common';
import { BrickRepository } from '../infrastructure';
import { BrickVoteRepository, BrickVoteResult } from '../infrastructure/brick-vote.repository';
import { NotificationBatchService } from '@/modules/notifications/application';
import { NotificationType } from '@prisma/client';

@Injectable()
export class VoteBrickService {
    constructor(
        private readonly brickVoteRepository: BrickVoteRepository,
        private readonly brickRepository: BrickRepository,
        private readonly notificationBatchService: NotificationBatchService,
    ) {}

    async execute(brickId: string, userId: string, value: 1 | -1): Promise<BrickVoteResult> {
        const brick = await this.brickRepository.findById(brickId);
        if (!brick) throw new NotFoundException('Brick not found');

        const result = await this.brickVoteRepository.vote(brickId, userId, value);

        // Only notify on upvote, not downvote, and not self-vote
        if (value === 1 && result.userVote === 1 && brick.userId !== userId) {
            await this.notificationBatchService.addNotification({
                type: NotificationType.UPVOTE_BRICK,
                recipientId: brick.userId,
                actorId: userId,
                brickId,
            });
        }

        return result;
    }
}
