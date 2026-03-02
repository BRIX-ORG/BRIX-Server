import { Injectable } from '@nestjs/common';
import { CommentRepository } from '../infrastructure/comment.repository';

@Injectable()
export class DeleteCommentService {
    constructor(private readonly commentRepository: CommentRepository) {}

    async execute(commentId: string, userId: string): Promise<void> {
        await this.commentRepository.delete(commentId, userId);
    }
}
