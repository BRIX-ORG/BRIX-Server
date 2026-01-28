import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { PasswordService } from '@auth/application';
import type { UserEntity } from '@users/domain';

@Injectable()
export class ValidateLocalUserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordService: PasswordService,
    ) {}

    async execute(identifier: string, password: string): Promise<UserEntity> {
        // Find user by username or email
        const user = await this.userRepository.findByUsernameOrEmail(identifier);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await this.passwordService.comparePasswords(
            password,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }
}
