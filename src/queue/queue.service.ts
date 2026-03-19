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
    BrickDescriptionJobData,
    PhotoUploadJobData,
    SyncUserJobData,
    SyncBrickJobData,
    DistributeIpfsJobData,
    MintSuccessJobData,
    DonateJobData,
} from '@/queue/types';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue('email') private emailQueue: Queue,
        @InjectQueue('notifications') private notificationQueue: Queue,
        @InjectQueue('brick-description') private brickDescriptionQueue: Queue,
        @InjectQueue('photo-upload') private photoUploadQueue: Queue,
        @InjectQueue('algolia') private algoliaQueue: Queue,
        @InjectQueue('onchain') private onchainQueue: Queue,
    ) {}

    // Add a notification flush job with 10 minutes delay
    async addNotificationFlushJob(
        type: string,
        recipientId: string,
        brickId?: string,
        commentId?: string,
        groupId?: string,
    ): Promise<void> {
        const baseKey = `notif:${type}:${recipientId}:${brickId ?? 'null'}:${commentId ?? 'null'}`;
        const jobId = `flush-${type}-${recipientId}-${brickId ?? 'null'}-${commentId ?? 'null'}`;

        await this.notificationQueue.add(
            'flush-notification',
            { type, recipientId, brickId, commentId, groupId, baseKey },
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

    // Add a brick description generation job
    async addBrickDescriptionJob(brickId: string, imageUrl: string): Promise<void> {
        const jobData: BrickDescriptionJobData = { brickId, imageUrl };

        await this.brickDescriptionQueue.add('generate-description', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });

        this.logger.log(`Brick description job added for brick ${brickId}`);
    }

    // Add a photo upload processing job
    async addPhotoUploadJob(data: PhotoUploadJobData): Promise<void> {
        await this.photoUploadQueue.add('process-photo-upload', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });

        this.logger.log(
            `Photo upload job added for session ${data.sessionId}, user ${data.userId}`,
        );
    }

    async addSyncUserJob(userId: string): Promise<void> {
        await this.algoliaQueue.add('sync-user', { userId } as SyncUserJobData, {
            jobId: `sync-user-${userId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
        });
    }

    async addSyncBrickJob(brickId: string): Promise<void> {
        await this.algoliaQueue.add('sync-brick', { brickId } as SyncBrickJobData, {
            jobId: `sync-brick-${brickId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
        });
    }

    async addRemoveUserJob(userId: string): Promise<void> {
        await this.algoliaQueue.add('remove-user', { userId } as SyncUserJobData, {
            jobId: `remove-user-${userId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
        });
    }

    async addRemoveBrickJob(brickId: string): Promise<void> {
        await this.algoliaQueue.add('remove-brick', { brickId } as SyncBrickJobData, {
            jobId: `remove-brick-${brickId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
        });
    }

    // Add a job to handle Distribute IPFS logic after smart contract event
    async addDistributeIpfsJob(userId: string, brickId: string, txHash: string): Promise<void> {
        const jobData: DistributeIpfsJobData = { userId, brickId, txHash };
        await this.onchainQueue.add('process-distribute-ipfs', jobData, {
            attempts: 5, // Extra attempts for IPFS uploads
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: false,
        });
        this.logger.log(`Distribute IPFS job added for brick ${brickId}`);
    }

    // Add a job to handle Mint Success logic after smart contract event
    async addMintSuccessJob(ipfsCid: string, txHash: string): Promise<void> {
        const jobData: MintSuccessJobData = { ipfsCid, txHash };
        await this.onchainQueue.add('process-mint-success', jobData, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: false,
        });
        this.logger.log(`Mint Success job added for IPFS CID ${ipfsCid}`);
    }

    // Add a job to handle Donate logic after smart contract event
    async addDonateJob(
        onChainBrickId: number,
        donorAddress: string,
        amount: string,
        artistAmount: string,
        platformAmount: string,
        txHash: string,
    ): Promise<void> {
        const jobData: DonateJobData = {
            onChainBrickId,
            donorAddress,
            amount,
            artistAmount,
            platformAmount,
            txHash,
        };
        await this.onchainQueue.add('process-donate', jobData, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: false,
        });
        this.logger.log(`Donate job added for onchain brick ${onChainBrickId} (txHash: ${txHash})`);
    }
}
