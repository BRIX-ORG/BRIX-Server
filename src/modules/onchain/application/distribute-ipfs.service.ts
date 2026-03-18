import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OnchainRepository } from '@onchain/infrastructure';
import { PinataService } from '@/pinata';
import { DistributeIpfsJobData } from '@/queue/types';
import { OnchainGateway } from '@/socket/onchain.gateway';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class DistributeIpfsService {
    private readonly logger = new Logger(DistributeIpfsService.name);

    constructor(
        private readonly onchainRepository: OnchainRepository,
        private readonly pinata: PinataService,
        private readonly onchainGateway: OnchainGateway,
    ) {}

    async execute(data: DistributeIpfsJobData): Promise<void> {
        const { userId, brickId, txHash } = data;

        this.logger.log(`Starting Distribute IPFS for Brick ID: ${brickId} (txHash: ${txHash})`);

        const brick = await this.onchainRepository.getBrickForIpfs(brickId);

        if (!brick || !brick.metadata) {
            throw new BadRequestException('Brick or metadata not found');
        }

        // Prevent double processing
        if (
            brick.metadata.onChainStatus === 'ipfs_uploaded' ||
            brick.metadata.onChainStatus === 'onchain'
        ) {
            this.logger.log(
                `Brick ${brickId} already processed (status: ${brick.metadata.onChainStatus})`,
            );
            return;
        }

        try {
            // 2. Extract media URL
            const media = brick.media as Record<string, unknown> | null;
            const mediaUrl = media?.url as string | undefined;
            if (!mediaUrl) {
                throw new BadRequestException('Brick media URL not found');
            }

            // 3. Download image buffer
            const response = await axios.get<ArrayBuffer>(mediaUrl, {
                responseType: 'arraybuffer',
            });
            const imageBuffer = Buffer.from(response.data);

            // 4. Compute SHA-256
            const hashSha256 = crypto.createHash('sha256').update(imageBuffer).digest('hex');

            // 5. Upload Image to Pinata
            // Note: PinataService expects an Express.Multer.File format
            const mockFile = {
                buffer: imageBuffer,
                originalname: `${brickId}.jpg`,
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            const imageUpload = await this.pinata.uploadFile(mockFile, `brick_image_${brickId}`);
            const imageCid = imageUpload.cid;

            const modelData = brick.metadata.modelData as Record<string, unknown> | null;
            const nonce = (modelData?.nonce as string) || '000000';
            const metadataJson = {
                username: brick.user.username,
                timestamp: Math.floor(Date.now() / 1000),
                nonce: nonce,
                image: `ipfs://${imageCid}`,
            };

            // 7. Upload Metadata JSON to Pinata
            const metadataBuffer = Buffer.from(JSON.stringify(metadataJson, null, 2));
            const mockMetaFile = {
                buffer: metadataBuffer,
                originalname: `${brickId}_meta.json`,
                mimetype: 'application/json',
            } as Express.Multer.File;

            const metaUpload = await this.pinata.uploadFile(mockMetaFile, `brick_meta_${brickId}`);
            const ipfsCid = metaUpload.cid;

            // 8. Update DB
            await this.onchainRepository.updateIpfsStatus(brickId, {
                hashSha256,
                imageCid,
                ipfsCid,
            });

            this.logger.log(`Successfully distributed brick ${brickId} to IPFS. CID: ${ipfsCid}`);

            // 9. Notify Frontend
            this.onchainGateway.emitIpfsUploaded(userId, {
                brickId,
                imageCid,
                ipfsCid,
                hashSha256,
            });
        } catch (error) {
            this.logger.error(
                `Failed to distribute IPFS for brick ${brickId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            await this.onchainRepository.markIpfsFailed(brickId);
            throw error;
        }
    }
}
