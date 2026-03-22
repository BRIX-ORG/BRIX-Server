import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { ethers } from 'ethers';
import { UserRepository } from '@users/infrastructure';
import { WalletRepository } from '@wallets/domain';
import { LinkWalletDto, WalletResponseDto } from '@wallets/dto';

@Injectable()
export class LinkWalletService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly walletRepository: WalletRepository,
    ) {}

    async execute(userId: string, dto: LinkWalletDto): Promise<WalletResponseDto> {
        const { address, signature, message } = dto;

        // 1. Fetch user to check nonce
        const user = await this.userRepository.findById(userId);
        if (!user || !user.walletNonce) {
            throw new BadRequestException('Request a nonce first');
        }

        // 2. Verify message contains the nonce
        if (!message.includes(user.walletNonce)) {
            throw new BadRequestException('Invalid or expired nonce in message');
        }

        // 3. Verify signature
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                throw new BadRequestException('Signature verification failed: address mismatch');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new BadRequestException(`Signature verification failed: ${message}`);
        }

        // 4. Check if address is already linked to SOMEONE ELSE
        const existingWallet = await this.walletRepository.findByAddress(address);
        if (existingWallet) {
            if (existingWallet.userId === userId) {
                throw new ConflictException('This wallet is already linked to your account');
            } else {
                throw new ConflictException('This wallet is already linked to another account');
            }
        }

        // 5. Link wallet
        const newWallet = await this.walletRepository.create({
            address: address.toLowerCase(),
            userId,
        });

        // 6. Clear nonce to prevent reuse
        await this.userRepository.update(userId, { walletNonce: null });

        return WalletResponseDto.fromEntity(newWallet);
    }
}
