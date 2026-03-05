import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentRepository, BrickRepository } from '@bricks/infrastructure';

@Injectable()
export class GetCommentsService {
    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly brickRepository: BrickRepository,
    ) {}

    async execute(brickId: string, limit: number = 20, cursor?: string) {
        const brick = await this.brickRepository.findById(brickId);
        if (!brick) throw new NotFoundException('Brick not found');

        return this.commentRepository.findRootCommentsByBrick(brickId, limit, cursor);
    }
}
