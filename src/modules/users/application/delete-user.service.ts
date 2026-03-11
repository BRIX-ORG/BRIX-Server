import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { QueueService } from '@/queue';

@Injectable()
export class DeleteUserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly queueService: QueueService,
    ) {}

    async execute(id: string): Promise<void> {
        // Check if user exists
        const exists = await this.userRepository.exists(id);
        if (!exists) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        await this.userRepository.delete(id);

        // Remove user from Algolia via queue
        void this.queueService.addRemoveUserJob(id);
    }
}
