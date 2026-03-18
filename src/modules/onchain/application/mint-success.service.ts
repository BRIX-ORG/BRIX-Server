import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OnchainRepository } from '@onchain/infrastructure';
import { MintSuccessJobData } from '@/queue/types';
import { OnchainGateway } from '@/socket/onchain.gateway';

@Injectable()
export class MintSuccessService {
    private readonly logger = new Logger(MintSuccessService.name);

    constructor(
        private readonly onchainRepository: OnchainRepository,
        private readonly onchainGateway: OnchainGateway,
    ) {}

    async execute(data: MintSuccessJobData): Promise<void> {
        const { ipfsCid, txHash } = data;

        this.logger.log(`Starting Mint Success processing for CID: ${ipfsCid}`);

        const metadata = await this.onchainRepository.getMetadataByIpfsCid(ipfsCid);

        if (!metadata) {
            this.logger.warn(`Could not find BrickMetadata for CID ${ipfsCid}`);
            throw new BadRequestException(`No brick found with IPFS CID ${ipfsCid}`);
        }

        // Prevent double processing
        if (metadata.onChainStatus === 'onchain') {
            this.logger.log(`Brick ${metadata.brickId} is already minted onchain`);
            return;
        }

        await this.onchainRepository.markAsMinted(metadata.id, metadata.brickId, txHash);

        this.logger.log(
            `Successfully completed onchain mint processing for brick ${metadata.brickId}`,
        );

        // Notify Frontend
        this.onchainGateway.emitBrickMinted(metadata.brick.userId, {
            brickId: metadata.brickId,
            txHash,
        });
    }
}
