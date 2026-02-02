import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '@/redis';
import { EmailService } from '@/email';
import { UserRepository } from '@users/infrastructure';

@Injectable()
export class EmailVerificationService {
    private readonly logger = new Logger(EmailVerificationService.name);
    private readonly OTP_EXPIRY = 300; // 5 minutes in seconds

    constructor(
        private readonly redisService: RedisService,
        private readonly emailService: EmailService,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Only allow email verification for LOCAL auth users
        if (user.provider !== 'LOCAL') {
            throw new BadRequestException('Email verification is only for local auth users');
        }

        // Check if already verified
        if (user.verifiedAt) {
            throw new BadRequestException('Email is already verified');
        }

        // Generate 6-digit OTP
        const otp = this.generateOtp();

        // Store OTP in Redis with attempts counter
        const otpKey = `ev:otp:${email}`;
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
            await this.emailService.sendEmailVerification(email, otp);
            this.logger.log(`Verification OTP sent successfully to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${email}`, error);
            throw new BadRequestException('Failed to send verification email');
        }
    }

    private generateOtp(): string {
        // Generate random 6-digit number
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
