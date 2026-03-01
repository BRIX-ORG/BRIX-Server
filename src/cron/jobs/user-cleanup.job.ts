import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserRepository } from '@users/infrastructure';

@Injectable()
export class UserCleanupJob {
    private readonly logger = new Logger(UserCleanupJob.name);

    constructor(private readonly userRepository: UserRepository) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async cleanupUnverifiedUsers(): Promise<void> {
        this.logger.log('Starting cleanup of unverified users');

        try {
            const count = await this.userRepository.countUnverifiedUsers(15);

            if (count === 0) {
                this.logger.log('No unverified users found to cleanup');
                return;
            }

            this.logger.log(`Found ${count} unverified users to cleanup`);

            const deletedCount = await this.userRepository.deleteUnverifiedUsers(15);

            this.logger.log(`Successfully deleted ${deletedCount} unverified users`);
        } catch (error) {
            this.logger.error('Failed to cleanup unverified users', error);
        }
    }
}
