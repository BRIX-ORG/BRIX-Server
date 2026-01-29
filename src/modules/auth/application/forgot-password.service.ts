import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@/redis';
import { EmailService } from '@/email';
import { UserRepository } from '@users/infrastructure';

@Injectable()
export class ForgotPasswordService {
    private readonly logger = new Logger(ForgotPasswordService.name);
    private readonly OTP_EXPIRY = 300; // 5 minutes in seconds

    constructor(
        private readonly redisService: RedisService,
        private readonly emailService: EmailService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(email: string): Promise<void> {
        // Always returns success to prevent email enumeration
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            this.logger.warn(`Password reset requested for non-existent email: ${email}`);
            // Still return success, but don't send email
            return;
        }

        // Generate 6-digit OTP
        const otp = this.generateOtp();

        // Store OTP in Redis with attempts counter
        const otpKey = `fp:otp:${email}`;
        await this.redisService.set(
            otpKey,
            {
                otp,
                attempts: 0,
            },
            this.OTP_EXPIRY,
        );

        // Send OTP email
        try {
            await this.emailService.sendForgotPasswordOtp(email, otp);
            this.logger.log(`OTP sent successfully to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send OTP email to ${email}`, error);
            // Don't throw error to maintain security (always return 200)
        }
    }

    private generateOtp(): string {
        // Generate random 6-digit number
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
