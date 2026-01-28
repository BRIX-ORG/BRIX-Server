import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../infrastructure';

@Injectable()
export class DeleteUserService {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(id: string): Promise<void> {
        // Check if user exists
        const exists = await this.userRepository.exists(id);
        if (!exists) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        await this.userRepository.delete(id);
    }
}
