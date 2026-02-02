import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '@/email';
import { EmailJobType, EmailJobData } from '../types';

@Processor('email', {
    concurrency: 5, // Process up to 5 email jobs concurrently
})
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailProcessor.name);

    constructor(private readonly emailService: EmailService) {
        super();
    }

    async process(job: Job<EmailJobData>): Promise<void> {
        const { type, data } = job.data;
        this.logger.log(`Processing email job ${job.id} of type ${type}`);

        try {
            switch (type) {
                case EmailJobType.WELCOME:
                    await this.emailService.sendWelcomeEmail(data.email, data.appUrl);
                    this.logger.log(`Welcome email sent to ${data.email}`);
                    break;

                case EmailJobType.PASSWORD_RESET_SUCCESS:
                    await this.emailService.sendPasswordResetSuccess(data.email);
                    this.logger.log(`Password reset success email sent to ${data.email}`);
                    break;

                case EmailJobType.EMAIL_VERIFICATION:
                    await this.emailService.sendEmailVerification(data.email, data.otp);
                    this.logger.log(`Email verification sent to ${data.email}`);
                    break;

                case EmailJobType.FORGOT_PASSWORD_OTP:
                    await this.emailService.sendForgotPasswordOtp(data.email, data.otp);
                    this.logger.log(`Forgot password OTP sent to ${data.email}`);
                    break;

                default: {
                    const _exhaustiveCheck: never = type;
                    this.logger.warn(`Unknown email job type: ${String(_exhaustiveCheck)}`);
                    break;
                }
            }
        } catch (error) {
            this.logger.error(
                `Failed to process email job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error; // Re-throw to let BullMQ handle retry logic
        }
    }
}
