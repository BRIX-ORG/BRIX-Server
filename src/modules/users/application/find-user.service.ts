import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../infrastructure';
import { UserEntity } from '../domain';

@Injectable()
export class FindUserService {
    constructor(private readonly userRepository: UserRepository) {}

    async findAll(): Promise<UserEntity[]> {
        return this.userRepository.findAll();
    }

    async findById(id: string): Promise<UserEntity> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.userRepository.findByEmail(email);
    }
}
