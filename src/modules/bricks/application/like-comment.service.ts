import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentRepository } from '../infrastructure/comment.repository';
import {
    CommentVoteRepository,
    CommentVoteResult,
} from '../infrastructure/comment-vote.repository';
import { NotificationBatchService } from '@/modules/notifications/application';
import { NotificationType } from '@prisma/client';

@Injectable()
export class LikeCommentService {
    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly commentVoteRepository: CommentVoteRepository,
        private readonly notificationBatchService: NotificationBatchService,
    ) {}

    async execute(commentId: string, userId: string): Promise<CommentVoteResult> {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) throw new NotFoundException('Comment not found');

        const result = await this.commentVoteRepository.toggleLike(commentId, userId);

        // Only notify when liking (not unliking), and not self-like
        if (result.liked && comment.userId !== userId) {
            await this.notificationBatchService.addNotification({
                type: NotificationType.REPLY_COMMENT,
                recipientId: comment.userId,
                actorId: userId,
                brickId: comment.brickId,
                commentId,
            });
        }

        return result;
    }
}
