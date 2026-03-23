import { Injectable, NotFoundException } from '@nestjs/common';
import { BrickRepository } from '@bricks/infrastructure';

@Injectable()
export class GetBrickDetailService {
    constructor(private readonly brickRepository: BrickRepository) {}

    async execute(brickId: string) {
        const brick = await this.brickRepository.findByIdWithUser(brickId);
        if (!brick) {
            throw new NotFoundException('Brick not found');
        }
        return brick;
    }
}
