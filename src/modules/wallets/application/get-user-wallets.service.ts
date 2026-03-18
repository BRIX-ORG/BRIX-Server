import { Injectable } from '@nestjs/common';
import { WalletRepository } from '../domain';
import { WalletResponseDto } from '../dto';

@Injectable()
export class GetUserWalletsService {
    constructor(private readonly walletRepository: WalletRepository) {}

    async execute(userId: string): Promise<WalletResponseDto[]> {
        const wallets = await this.walletRepository.findManyByUserId(userId);
        return wallets.map((w) => WalletResponseDto.fromEntity(w));
    }
}
