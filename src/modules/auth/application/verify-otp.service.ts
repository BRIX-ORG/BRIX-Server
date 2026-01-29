import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { RedisService } from '@/redis';
import { ConfigService } from '@nestjs/config';
import type { OtpData } from '@auth/domain';
import * as crypto from 'crypto';

@Injectable()
export class VerifyOtpService {
    private readonly logger = new Logger(VerifyOtpService.name);
    private readonly MAX_ATTEMPTS: number;
    private readonly RESET_TOKEN_EXPIRY: number;

    constructor(
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {
        this.MAX_ATTEMPTS = this.configService.get<number>('OTP_MAX_ATTEMPTS', 5);
        this.RESET_TOKEN_EXPIRY = this.configService.get<number>('RESET_TOKEN_EXPIRY_SECONDS', 300);
    }

    async execute(email: string, otpInput: string): Promise<{ resetToken: string }> {
        const otpKey = `fp:otp:${email}`;

        // Get OTP data from Redis
        const otpData = await this.redisService.get<OtpData>(otpKey);

        if (!otpData) {
            throw new UnauthorizedException('OTP not found or expired');
        }

        // Check if max attempts exceeded
        if (otpData.attempts >= this.MAX_ATTEMPTS) {
            await this.redisService.delete(otpKey);
            throw new UnauthorizedException('Maximum OTP attempts exceeded. Request a new OTP.');
        }

        // Verify OTP
        if (otpData.otp !== otpInput) {
            // Increment attempts
            otpData.attempts += 1;
            await this.redisService.set(otpKey, otpData, this.RESET_TOKEN_EXPIRY);

            const remainingAttempts = this.MAX_ATTEMPTS - otpData.attempts;
            this.logger.warn(
                `Invalid OTP for ${email}. Attempts: ${otpData.attempts}/${this.MAX_ATTEMPTS}`,
            );

            throw new UnauthorizedException(
                `Invalid OTP. ${remainingAttempts} attempts remaining.`,
            );
        }

        // OTP is valid - generate reset token
        const resetToken = this.generateResetToken();
        const tokenHash = this.hashToken(resetToken);

        // Store reset token in Redis
        const resetKey = `fp:reset:${email}`;
        await this.redisService.set(
            resetKey,
            {
                token: tokenHash,
            },
            this.RESET_TOKEN_EXPIRY,
        );

        // Delete OTP from Redis
        await this.redisService.delete(otpKey);

        this.logger.log(`Reset token generated for ${email}`);

        return { resetToken };
    }

    private generateResetToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
}
