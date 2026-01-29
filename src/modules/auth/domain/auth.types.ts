import type { UserResponseDto } from '@users/dto';

export interface JwtPayload {
    sub: string; // User ID
    username: string;
    email: string;
    role: 'user' | 'admin';
    provider: 'local' | 'google';
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number; // Unix timestamp
    refreshTokenExpiresAt: number; // Unix timestamp
}

export interface AuthResponse extends AuthTokens {
    user: UserResponseDto;
}
