import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';

@Injectable()
export class UserCleanupService {
    private readonly logger = new Logger(UserCleanupService.name);

    constructor(private readonly userRepository: UserRepository) {}

    // Manual cleanup method for testing
    async cleanupUnverifiedUsersNow(): Promise<number> {
        this.logger.log('Manual cleanup of unverified users triggered');

        const deletedCount = await this.userRepository.deleteUnverifiedUsers(15);
        this.logger.log(`Manual cleanup deleted ${deletedCount} unverified users`);

        return deletedCount;
    }
}
