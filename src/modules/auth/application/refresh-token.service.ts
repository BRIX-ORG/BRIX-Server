import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { JwtTokenService } from '@auth/application';
import type { AuthResponse } from '@auth/domain';
import { UserResponseDto } from '@users/dto';

@Injectable()
export class RefreshTokenService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    async execute(refreshToken: string): Promise<AuthResponse> {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        try {
            // Verify refresh token
            const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);

            // Find user
            const user = await this.userRepository.findById(payload.sub);
            if (!user || user.refreshToken !== refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Generate new tokens
            const tokens = this.jwtTokenService.generateTokens(user);

            // Update refresh token
            await this.userRepository.update(user.id, {
                refreshToken: tokens.refreshToken,
            });

            return {
                ...tokens,
                user: UserResponseDto.fromEntity(user),
            };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
