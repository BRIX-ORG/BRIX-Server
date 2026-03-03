import { Injectable } from '@nestjs/common';
import { CommentRepository } from '../infrastructure/comment.repository';

@Injectable()
export class UpdateCommentService {
    constructor(private readonly commentRepository: CommentRepository) {}

    async execute(commentId: string, userId: string, content: string) {
        return this.commentRepository.update(commentId, userId, content);
    }
}
