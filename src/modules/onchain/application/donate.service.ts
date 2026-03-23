import { Injectable, Logger } from '@nestjs/common';
import { OnchainRepository } from '@onchain/infrastructure';
import type { DonateJobData } from '@/queue/types';
import { ethers } from 'ethers';

@Injectable()
export class DonateService {
    private readonly logger = new Logger(DonateService.name);

    constructor(private readonly onchainRepository: OnchainRepository) {}

    async execute(data: DonateJobData): Promise<void> {
        const { onChainBrickId, donorAddress, amount, txHash } = data;

        this.logger.log(
            `Processing Donate job: onChainBrickId=${onChainBrickId}, donor=${donorAddress}, txHash=${txHash}`,
        );

        // Idempotency: skip if txHash already recorded
        const existing = await this.onchainRepository.getDonationByTxHash(txHash);
        if (existing) {
            this.logger.log(`Donation ${txHash} already recorded. Skipping.`);
            return;
        }

        // Lookup brick UUID from on-chain sequential ID
        const metadata = await this.onchainRepository.getMetadataByOnChainId(onChainBrickId);
        if (!metadata) {
            this.logger.warn(
                `No BrickMetadata found for onChainId=${onChainBrickId}. Donation ${txHash} skipped.`,
            );
            return;
        }

        // Convert wei string to decimal (18 decimals for MATIC)
        const amountDecimal = ethers.formatUnits(amount, 18);

        await this.onchainRepository.createDonation(
            metadata.brickId,
            donorAddress,
            amountDecimal,
            txHash,
        );

        this.logger.log(
            `Donation recorded for brick ${metadata.brickId}: ${amountDecimal} MATIC from ${donorAddress}`,
        );
    }
}
