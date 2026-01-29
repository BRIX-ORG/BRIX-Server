import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload, AuthTokens } from '@auth/domain';
import type { UserEntity } from '@users/domain';

@Injectable()
export class JwtTokenService {
    constructor(
        private readonly jwtService: NestJwtService,
        private readonly configService: ConfigService,
    ) {}

    // Create JWT payload from user entity
    createPayload(user: UserEntity): JwtPayload {
        return {
            sub: user.id,
            username: user.username,
            email: user.email,
            role: user.role.toLowerCase() as 'user' | 'admin',
            provider: user.provider.toLowerCase() as 'local' | 'google',
        };
    }

    // Generate access token (short-lived)
    generateAccessToken(payload: JwtPayload): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        });
    }

    // Generate refresh token (long-lived)
    generateRefreshToken(payload: JwtPayload): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });
    }

    // Generate both access and refresh tokens with expiration
    generateTokens(user: UserEntity): AuthTokens {
        const payload = this.createPayload(user);
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);

        // Decode tokens to get 'exp' claim (Unix timestamp)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const accessDecoded = this.jwtService.decode(accessToken);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const refreshDecoded = this.jwtService.decode(refreshToken);

        return {
            accessToken,
            refreshToken,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            accessTokenExpiresAt: (accessDecoded?.exp ?? 0) * 1000, // Convert to ms
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            refreshTokenExpiresAt: (refreshDecoded?.exp ?? 0) * 1000, // Convert to ms
        };
    }

    // Verify and decode refresh token
    async verifyRefreshToken(token: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
    }
}
