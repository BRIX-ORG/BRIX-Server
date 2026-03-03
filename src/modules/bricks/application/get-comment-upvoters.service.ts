import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentVoteRepository } from '../infrastructure/comment-vote.repository';
import { CommentRepository } from '../infrastructure/comment.repository';

@Injectable()
export class GetCommentUpvotersService {
    constructor(
        private readonly commentVoteRepository: CommentVoteRepository,
        private readonly commentRepository: CommentRepository,
    ) {}

    async execute(commentId: string) {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        return this.commentVoteRepository.findUpvotersByCommentId(commentId);
    }
}
