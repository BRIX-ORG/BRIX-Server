import { Injectable, NotFoundException } from '@nestjs/common';
import { BrickVoteRepository, BrickRepository } from '../infrastructure';

@Injectable()
export class GetBrickUpvotersService {
    constructor(
        private readonly brickVoteRepository: BrickVoteRepository,
        private readonly brickRepository: BrickRepository,
    ) {}

    async execute(brickId: string) {
        const brick = await this.brickRepository.findById(brickId);
        if (!brick) {
            throw new NotFoundException('Brick not found');
        }

        return this.brickVoteRepository.findUpvotersByBrickId(brickId);
    }
}
