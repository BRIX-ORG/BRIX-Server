import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';
import { Brick, BrickMetadata, User } from '@prisma/client';

@Injectable()
export class OnchainRepository {
    constructor(private readonly prisma: PrismaService) {}

    async getBrickForIpfs(
        brickId: string,
    ): Promise<(Brick & { metadata: BrickMetadata | null; user: User }) | null> {
        return this.prisma.brick.findUnique({
            where: { id: brickId },
            include: {
                metadata: true,
                user: true,
            },
        });
    }

    async updateIpfsStatus(
        brickId: string,
        data: { hashSha256: string; imageCid: string; ipfsCid: string },
    ): Promise<void> {
        await this.prisma.brickMetadata.update({
            where: { brickId },
            data: {
                hashSha256: data.hashSha256,
                imageCid: data.imageCid,
                ipfsCid: data.ipfsCid,
                onChainStatus: 'ipfs_uploaded',
            },
        });
    }

    async markIpfsFailed(brickId: string): Promise<void> {
        await this.prisma.brickMetadata.update({
            where: { brickId },
            data: { onChainStatus: 'failed' },
        });
    }

    async getMetadataByIpfsCid(
        ipfsCid: string,
    ): Promise<(BrickMetadata & { brick: { userId: string } }) | null> {
        return this.prisma.brickMetadata.findFirst({
            where: { ipfsCid },
            include: { brick: { select: { userId: true } } },
        });
    }

    async markAsMinted(metadataId: string, brickId: string, txHash: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            // Update BrickMetadata
            await tx.brickMetadata.update({
                where: { id: metadataId },
                data: {
                    onChainStatus: 'onchain',
                    onChainTx: txHash,
                },
            });

            // Log Activity
            await tx.onChainActivity.create({
                data: {
                    brickId: brickId,
                    type: 'MINT',
                    txHash,
                    status: 'success',
                },
            });
        });
    }
}
