import { Injectable } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { WalletNonceResponseDto } from '@wallets/dto';

@Injectable()
export class GetWalletNonceService {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(userId: string): Promise<WalletNonceResponseDto> {
        // Generate a random 6-digit nonce
        const nonce = Math.floor(100000 + Math.random() * 900000).toString();

        // Save nonce to user record
        await this.userRepository.update(userId, { walletNonce: nonce });

        return new WalletNonceResponseDto(`Link wallet: ${nonce}`);
    }
}
