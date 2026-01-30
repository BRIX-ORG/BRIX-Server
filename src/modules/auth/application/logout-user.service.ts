import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { JwtTokenService } from '@auth/application';

@Injectable()
export class LogoutUserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    async execute(refreshToken: string): Promise<{ message: string }> {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        try {
            // Verify refresh token
            const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);

            // Find user and invalidate token
            const user = await this.userRepository.findById(payload.sub);
            if (user && user.refreshToken === refreshToken) {
                await this.userRepository.update(user.id, {
                    refreshToken: undefined,
                });
            }

            return { message: 'Logged out successfully' };
        } catch {
            // Even if token is invalid, still return success for security
            return { message: 'Logged out successfully' };
        }
    }
}
