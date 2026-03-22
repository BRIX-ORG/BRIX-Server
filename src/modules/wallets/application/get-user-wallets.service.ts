import { Injectable } from '@nestjs/common';
import { WalletRepository } from '@wallets/domain';
import { WalletResponseDto } from '@wallets/dto';

@Injectable()
export class GetUserWalletsService {
    constructor(private readonly walletRepository: WalletRepository) {}

    async execute(userId: string): Promise<WalletResponseDto[]> {
        const wallets = await this.walletRepository.findManyByUserId(userId);
        return wallets.map((w) => WalletResponseDto.fromEntity(w));
    }
}
