import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    EmailJobType,
    EmailJobData,
    WelcomeEmailJob,
    PasswordResetSuccessEmailJob,
    EmailVerificationJob,
    ForgotPasswordOtpJob,
} from './types';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue('email') private emailQueue: Queue,
        @InjectQueue('notifications') private notificationQueue: Queue,
    ) {}

    // Add a notification flush job with 10 minutes delay
    async addNotificationFlushJob(
        type: string,
        recipientId: string,
        brickId?: string,
        commentId?: string,
        groupId?: string,
    ): Promise<void> {
        const jobId = `flush:${type}:${recipientId}:${brickId ?? 'null'}:${commentId ?? 'null'}:${groupId ?? 'new'}`;

        await this.notificationQueue.add(
            'flush-notification',
            { type, recipientId, brickId, commentId, groupId },
            {
                delay: 10 * 60 * 1000, // 10 minutes
                jobId, // Unique jobId prevents multiple jobs for same window
                removeOnComplete: true,
                removeOnFail: false,
            },
        );

        this.logger.log(`Notification flush job added: ${jobId}`);
    }

    // Add a welcome email job to the queue
    async sendWelcomeEmail(email: string, appUrl?: string): Promise<void> {
        const jobData: EmailJobData = {
            type: EmailJobType.WELCOME,
            data: { email, appUrl } as WelcomeEmailJob,
        };

        await this.emailQueue.add('welcome-email', jobData, {
            attempts: 3, // Retry up to 3 times
            backoff: {
                type: 'exponential',
                delay: 2000, // Start with 2 seconds delay
            },
            removeOnComplete: true, // Clean up after successful completion
            removeOnFail: false, // Keep failed jobs for debugging
        });

        this.logger.log(`Welcome email job added for ${email}`);
    }

    // Add a password reset success email job to the queue
    async sendPasswordResetSuccessEmail(email: string): Promise<void> {
        const jobData: EmailJobData = {
            type: EmailJobType.PASSWORD_RESET_SUCCESS,
            data: { email } as PasswordResetSuccessEmailJob,
        };

        await this.emailQueue.add('password-reset-success', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });

        this.logger.log(`Password reset success email job added for ${email}`);
    }

    // Add an email verification job to the queue
    async sendEmailVerification(email: string, otp: string): Promise<void> {
        const jobData: EmailJobData = {
            type: EmailJobType.EMAIL_VERIFICATION,
            data: { email, otp } as EmailVerificationJob,
        };

        await this.emailQueue.add('email-verification', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });

        this.logger.log(`Email verification job added for ${email}`);
    }

    // Add a forgot password OTP email job to the queue
    async sendForgotPasswordOtp(email: string, otp: string): Promise<void> {
        const jobData: EmailJobData = {
            type: EmailJobType.FORGOT_PASSWORD_OTP,
            data: { email, otp } as ForgotPasswordOtpJob,
        };

        await this.emailQueue.add('forgot-password-otp', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });

        this.logger.log(`Forgot password OTP job added for ${email}`);
    }

    // Get queue statistics
    async getEmailQueueStats() {
        const waiting = await this.emailQueue.getWaitingCount();
        const active = await this.emailQueue.getActiveCount();
        const completed = await this.emailQueue.getCompletedCount();
        const failed = await this.emailQueue.getFailedCount();

        return {
            waiting,
            active,
            completed,
            failed,
        };
    }
}
