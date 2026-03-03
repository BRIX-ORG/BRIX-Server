import { Injectable } from '@nestjs/common';
import { BrickVoteRepository, BrickVoteResult } from '../infrastructure/brick-vote.repository';

@Injectable()
export class GetBrickVoteStatusService {
    constructor(private readonly brickVoteRepository: BrickVoteRepository) {}

    async execute(brickId: string, userId?: string): Promise<BrickVoteResult> {
        return this.brickVoteRepository.getVoteStatus(brickId, userId);
    }
}
