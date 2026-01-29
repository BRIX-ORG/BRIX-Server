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
            name: user.fullName,
            email: user.email,
            avatar: user.avatar,
            background: user.background,
            address: user.address,
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

    // Generate both access and refresh tokens
    generateTokens(user: UserEntity): AuthTokens {
        const payload = this.createPayload(user);
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }

    // Verify and decode refresh token
    async verifyRefreshToken(token: string): Promise<JwtPayload> {
        return this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        });
    }
}
