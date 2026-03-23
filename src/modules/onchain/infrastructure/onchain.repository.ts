import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';
import type { Brick, BrickMetadata, Donation, User } from '@prisma/client';

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

    async updateIpfsPending(brickId: string): Promise<void> {
        await this.prisma.brickMetadata.update({
            where: { brickId },
            data: { onChainStatus: 'pending' },
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

    async getMetadataByOnChainId(
        onChainId: number,
    ): Promise<Pick<BrickMetadata, 'id' | 'brickId'> | null> {
        return this.prisma.brickMetadata.findFirst({
            where: { onChainId },
            select: { id: true, brickId: true },
        });
    }

    async markAsMinted(
        metadataId: string,
        brickId: string,
        txHash: string,
        onChainId: number,
    ): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await tx.brickMetadata.update({
                where: { id: metadataId },
                data: {
                    onChainStatus: 'onchain',
                    onChainTx: txHash,
                    onChainId: onChainId,
                },
            });

            await tx.onChainActivity.create({
                data: {
                    brickId,
                    type: 'MINT',
                    txHash,
                    status: 'success',
                },
            });
        });
    }

    async getDonationByTxHash(txHash: string): Promise<Pick<Donation, 'id'> | null> {
        return this.prisma.donation.findUnique({
            where: { txHash },
            select: { id: true },
        });
    }

    async createDonation(
        brickId: string,
        fromAddress: string,
        amount: string,
        txHash: string,
    ): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await tx.donation.create({
                data: {
                    brickId,
                    fromAddress,
                    amount,
                    txHash,
                },
            });

            await tx.onChainActivity.create({
                data: {
                    brickId,
                    type: 'DONATE',
                    txHash,
                    status: 'success',
                },
            });
        });
    }

    async getDonationsByBrickId(brickId: string): Promise<Donation[]> {
        return this.prisma.donation.findMany({
            where: { brickId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
