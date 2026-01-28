import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { UserEntity } from '@users/domain';
import { UpdateProfileDto } from '@users/dto';

@Injectable()
export class UpdateProfileService {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(id: string, dto: UpdateProfileDto): Promise<UserEntity> {
        // Check if user exists
        const exists = await this.userRepository.exists(id);
        if (!exists) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        const user = await this.userRepository.update(id, {
            fullName: dto.fullName,
            phone: dto.phone,
            avatar: dto.avatar,
            background: dto.background,
            address: dto.address,
            shortDescription: dto.shortDescription,
        });

        return user;
    }
}
