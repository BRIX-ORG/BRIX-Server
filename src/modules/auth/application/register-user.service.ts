import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { PasswordService, JwtTokenService } from '@auth/application';
import { EmailService } from '@/email';
import { RegisterDto } from '@auth/dto';
import { AuthResponse } from '@auth/domain';

@Injectable()
export class RegisterUserService {
    private readonly logger = new Logger(RegisterUserService.name);

    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordService: PasswordService,
        private readonly jwtTokenService: JwtTokenService,
        private readonly emailService: EmailService,
    ) {}

    async execute(dto: RegisterDto): Promise<AuthResponse> {
        // Check if email already exists
        const emailExists = await this.userRepository.emailExists(dto.email);
        if (emailExists) {
            throw new ConflictException(`Email "${dto.email}" already exists`);
        }

        // Check if username already exists
        const usernameExists = await this.userRepository.usernameExists(dto.username);
        if (usernameExists) {
            throw new ConflictException(`Username "${dto.username}" already exists`);
        }

        // Hash password
        const hashedPassword = await this.passwordService.hashPassword(dto.password);

        // Create user with default role and provider
        const user = await this.userRepository.create({
            username: dto.username,
            fullName: dto.fullName,
            email: dto.email,
            password: hashedPassword,
            phone: dto.phone,
        });

        // Generate tokens with full payload
        const tokens = this.jwtTokenService.generateTokens(user);

        // Update user with refresh token
        await this.userRepository.update(user.id, {
            refreshToken: tokens.refreshToken,
        });

        // Send welcome email (non-blocking)
        this.emailService.sendWelcomeEmail(user.email).catch((error) => {
            this.logger.error(`Failed to send welcome email to ${user.email}`, error);
            // Don't throw - registration was successful
        });

        return tokens;
    }
}
