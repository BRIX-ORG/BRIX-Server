import { Injectable, Logger } from '@nestjs/common';
import { OnchainRepository } from '@onchain/infrastructure';
import type { Donation } from '@prisma/client';

@Injectable()
export class GetDonationsService {
    private readonly logger = new Logger(GetDonationsService.name);

    constructor(private readonly onchainRepository: OnchainRepository) {}

    async execute(brickId: string): Promise<Donation[]> {
        this.logger.debug(`Retrieving donations for brick: ${brickId}`);
        return this.onchainRepository.getDonationsByBrickId(brickId);
    }
}
