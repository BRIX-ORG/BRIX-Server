import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WalletRepository } from '../domain';

@Injectable()
export class UnlinkWalletService {
    constructor(private readonly walletRepository: WalletRepository) {}

    async execute(userId: string, walletId: string): Promise<void> {
        const wallet = await this.walletRepository.findById(walletId);

        if (!wallet) {
            throw new NotFoundException('Wallet not found');
        }

        if (wallet.userId !== userId) {
            throw new ForbiddenException('You do not have permission to unlink this wallet');
        }

        await this.walletRepository.delete(walletId);
    }
}
