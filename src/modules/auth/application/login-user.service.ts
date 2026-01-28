import { Injectable } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { JwtTokenService } from './jwt-token.service';
import { AuthResponse } from '@auth/domain';
import { UserEntity } from '@users/domain';

@Injectable()
export class LoginUserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    // Completes the login process for a pre-validated user
    async execute(user: UserEntity): Promise<AuthResponse> {
        // Generate tokens with full payload
        const tokens = this.jwtTokenService.generateTokens(user);

        // Update user with refresh token in DB
        await this.userRepository.update(user.id, {
            refreshToken: tokens.refreshToken,
        });

        return tokens;
    }
}
