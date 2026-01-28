import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { UserEntity } from '@users/domain';
import { CreateUserDto } from '@users/dto';

@Injectable()
export class CreateUserService {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(dto: CreateUserDto): Promise<UserEntity> {
        // Check if email already exists
        const emailExists = await this.userRepository.emailExists(dto.email);
        if (emailExists) {
            throw new ConflictException(`Email "${dto.email}" already exists`);
        }

        // TODO: Hash password before saving
        const user = await this.userRepository.create({
            email: dto.email,
            password: dto.password,
            firstName: dto.firstName,
            lastName: dto.lastName,
        });

        return user;
    }
}
