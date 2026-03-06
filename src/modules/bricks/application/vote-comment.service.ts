import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentRepository } from '@bricks/infrastructure';
import { CommentVoteRepository, CommentVoteResult } from '@bricks/infrastructure';
import { NotificationBatchService } from '@/modules/notifications/application';
import { NotificationType } from '@prisma/client';

@Injectable()
export class VoteCommentService {
    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly commentVoteRepository: CommentVoteRepository,
        private readonly notificationBatchService: NotificationBatchService,
    ) {}

    async execute(commentId: string, userId: string, value: 1 | -1): Promise<CommentVoteResult> {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) throw new NotFoundException('Comment not found');

        const result = await this.commentVoteRepository.vote(commentId, userId, value);

        // Only notify on upvote, not downvote, and not self-vote
        if (value === 1 && result.userVote === 1 && comment.userId !== userId) {
            await this.notificationBatchService.addNotification({
                type: NotificationType.UPVOTE_COMMENT,
                recipientId: comment.userId,
                actorId: userId,
                brickId: comment.brickId,
                commentId,
            });
        }

        return result;
    }
}
