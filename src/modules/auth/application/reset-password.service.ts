import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { RedisService } from '@/redis';
import { QueueService } from '@/queue';
import { UserRepository } from '@users/infrastructure';
import { PasswordService } from './password.service';
import type { ResetTokenData } from '@auth/domain';
import * as crypto from 'crypto';

@Injectable()
export class ResetPasswordService {
    private readonly logger = new Logger(ResetPasswordService.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly queueService: QueueService,
        private readonly userRepository: UserRepository,
        private readonly passwordService: PasswordService,
    ) {}

    async execute(email: string, resetToken: string, newPassword: string): Promise<void> {
        const resetKey = `fp:reset:${email}`;

        // Get reset token from Redis
        const tokenData = await this.redisService.get<ResetTokenData>(resetKey);

        if (!tokenData) {
            throw new UnauthorizedException('Reset token not found or expired');
        }

        // Verify token
        const tokenHash = this.hashToken(resetToken);
        if (tokenData.token !== tokenHash) {
            this.logger.warn(`Invalid reset token for ${email}`);
            throw new UnauthorizedException('Invalid reset token');
        }

        // Find user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // This shouldn't happen since OTP was sent, but handle it anyway
            throw new NotFoundException('User not found');
        }

        // Hash new password
        const hashedPassword = await this.passwordService.hashPassword(newPassword);

        // Update password
        await this.userRepository.update(user.id, {
            password: hashedPassword,
        });

        // Delete reset token from Redis
        await this.redisService.delete(resetKey);

        // Add success email job to queue
        try {
            await this.queueService.sendPasswordResetSuccessEmail(email);
            this.logger.log(`Password reset successful for ${email}`);
        } catch (error) {
            this.logger.error(`Failed to queue success email for ${email}`, error);
            // Don't throw - password was already changed
        }
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
