import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';
import { Wallet } from '@prisma/client';
import { WalletEntity, WalletRepository } from '../domain';

@Injectable()
export class PrismaWalletRepository implements WalletRepository {
    constructor(private readonly prisma: PrismaService) {}

    private toEntity(record: Wallet): WalletEntity {
        return new WalletEntity({
            id: record.id,
            address: record.address,
            userId: record.userId,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    }

    async create(data: { address: string; userId: string }): Promise<WalletEntity> {
        const result = await this.prisma.wallet.create({
            data: {
                address: data.address.toLowerCase(),
                userId: data.userId,
            },
        });
        return this.toEntity(result);
    }

    async findById(id: string): Promise<WalletEntity | null> {
        const result = await this.prisma.wallet.findUnique({ where: { id } });
        return result ? this.toEntity(result) : null;
    }

    async findByAddress(address: string): Promise<WalletEntity | null> {
        const result = await this.prisma.wallet.findUnique({
            where: { address: address.toLowerCase() },
        });
        return result ? this.toEntity(result) : null;
    }

    async findManyByUserId(userId: string): Promise<WalletEntity[]> {
        const results = await this.prisma.wallet.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return results.map((r) => this.toEntity(r));
    }

    async delete(id: string): Promise<void> {
        await this.prisma.wallet.delete({ where: { id } });
    }
}
