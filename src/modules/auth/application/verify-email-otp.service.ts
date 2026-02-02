import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '@/redis';
import { UserRepository } from '@users/infrastructure';
import { ConfigService } from '@nestjs/config';
import type { OtpData } from '@auth/domain';

@Injectable()
export class VerifyEmailOtpService {
    private readonly logger = new Logger(VerifyEmailOtpService.name);
    private readonly MAX_ATTEMPTS: number;

    constructor(
        private readonly redisService: RedisService,
        private readonly userRepository: UserRepository,
        private readonly configService: ConfigService,
    ) {
        this.MAX_ATTEMPTS = this.configService.get<number>('OTP_MAX_ATTEMPTS', 5);
    }

    async execute(email: string, otpInput: string): Promise<void> {
        const otpKey = `ev:otp:${email}`;

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
            await this.redisService.set(otpKey, otpData, 300); // Keep same expiry

            const remainingAttempts = this.MAX_ATTEMPTS - otpData.attempts;
            this.logger.warn(
                `Invalid OTP for email verification ${email}. Attempts: ${otpData.attempts}/${this.MAX_ATTEMPTS}`,
            );

            throw new UnauthorizedException(
                `Invalid OTP. ${remainingAttempts} attempts remaining.`,
            );
        }

        // OTP is valid - update user isVerified
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Update user isVerified to true
        await this.userRepository.update(user.id, { isVerified: true });

        // Delete OTP from Redis
        await this.redisService.delete(otpKey);

        this.logger.log(`Email verified successfully for ${email}`);
    }
}
