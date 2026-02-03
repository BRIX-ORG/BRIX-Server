import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { UserEntity } from '@users/domain';
import { PasswordService } from '@/common';

@Injectable()
export class UpdatePasswordService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordService: PasswordService,
    ) {}

    async execute(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<UserEntity> {
        // Find user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with ID "${userId}" not found`);
        }

        // Verify current password
        const isPasswordValid = await this.passwordService.comparePasswords(
            currentPassword,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await this.passwordService.hashPassword(newPassword);

        // Update password
        const updatedUser = await this.userRepository.update(userId, {
            password: hashedPassword,
        });

        return updatedUser;
    }
}
