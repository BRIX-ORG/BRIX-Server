import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { FirebaseService } from '@/firebase';
import { UserRepository } from '@users/infrastructure';
import { JwtTokenService } from '@auth/application';
import type { AuthResponse } from '@auth/domain';
import { UserResponseDto } from '@users/dto';

@Injectable()
export class VerifyGoogleTokenService {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly userRepository: UserRepository,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    async execute(idToken: string): Promise<AuthResponse> {
        try {
            // Verify Firebase ID token
            const decodedToken = await this.firebaseService.verifyIdToken(idToken);

            // Extract user info from token
            const uid = decodedToken.uid;
            const email = decodedToken.email;
            const name = decodedToken.name as string | undefined;
            const picture = decodedToken.picture;

            if (!email) {
                throw new UnauthorizedException('Email not found in Google account');
            }

            // Check if user exists
            let user = await this.userRepository.findByEmail(email);

            if (user) {
                // User exists - check if provider matches
                if (user.provider !== 'GOOGLE') {
                    throw new ConflictException(
                        `An account with email "${email}" already exists with ${user.provider} provider. Please login with ${user.provider}.`,
                    );
                }

                // Update user info if needed (avatar, name, etc.)
                if (user.avatar !== picture || user.fullName !== (name || email.split('@')[0])) {
                    user = await this.userRepository.update(user.id, {
                        avatar: picture ?? undefined,
                        fullName: name ?? user.fullName,
                    });
                }
            } else {
                // Create new user
                const username = this.generateUsernameFromEmail(email);

                // Check if username exists
                const usernameExists = await this.userRepository.usernameExists(username);
                const finalUsername = usernameExists
                    ? `${username}${Math.floor(Math.random() * 10000)}`
                    : username;

                user = await this.userRepository.create({
                    username: finalUsername,
                    fullName: name ?? email.split('@')[0],
                    email,
                    password: uid, // Use Firebase UID as password placeholder
                    avatar: picture ?? null,
                    provider: 'GOOGLE',
                });

                // Update isVerified to true for Google users
                user = await this.userRepository.update(user.id, {
                    isVerified: true,
                });
            }

            // Generate JWT tokens
            const tokens = this.jwtTokenService.generateTokens(user);

            // Update refresh token in DB
            await this.userRepository.update(user.id, {
                refreshToken: tokens.refreshToken,
            });

            return {
                ...tokens,
                user: UserResponseDto.fromEntity(user),
            };
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof ConflictException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid Google ID token');
        }
    }

    private generateUsernameFromEmail(email: string): string {
        // Extract username part from email and sanitize
        const localPart = email.split('@')[0];
        // Remove special characters and replace with dots or underscores
        return localPart.replace(/[^a-zA-Z0-9._]/g, '_').toLowerCase();
    }
}
