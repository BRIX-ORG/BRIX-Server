import { Injectable } from '@nestjs/common';
import { CommentVoteRepository, CommentVoteResult } from '@bricks/infrastructure';

@Injectable()
export class GetCommentVoteStatusService {
    constructor(private readonly commentVoteRepository: CommentVoteRepository) {}

    async execute(commentId: string, userId?: string): Promise<CommentVoteResult> {
        return this.commentVoteRepository.getVoteStatus(commentId, userId);
    }
}
