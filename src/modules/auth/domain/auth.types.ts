export interface JwtPayload {
    sub: string; // User ID
    name: string;
    email: string;
    avatar: string | null;
    background: string | null;
    address: string | null;
    role: 'user' | 'admin';
    provider: 'local' | 'google';
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export type AuthResponse = AuthTokens;
