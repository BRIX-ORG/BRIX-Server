import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';
import { UserEntity, CreateUserData, UpdateProfileData, CloudinaryImageData } from '../domain';
import { Prisma, type User } from '@prisma/client';

// Helper function to check if string is a valid UUID
function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// Helper to convert CloudinaryImageData to Prisma-compatible JSON input
function toJsonInput(
    data: CloudinaryImageData | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    if (data === undefined) return undefined;
    if (data === null) return Prisma.JsonNull;
    return data as unknown as Prisma.InputJsonValue;
}

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<UserEntity[]> {
        const users: User[] = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return users.map((user) => new UserEntity(this.mapUserToEntity(user)));
    }

    async findById(id: string): Promise<UserEntity | null> {
        const user: User | null = await this.prisma.user.findUnique({
            where: { id },
        });
        return user ? new UserEntity(this.mapUserToEntity(user)) : null;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const user: User | null = await this.prisma.user.findUnique({
            where: { email },
        });
        return user ? new UserEntity(this.mapUserToEntity(user)) : null;
    }

    async findByUsername(username: string): Promise<UserEntity | null> {
        const user: User | null = await this.prisma.user.findUnique({
            where: { username },
        });
        return user ? new UserEntity(this.mapUserToEntity(user)) : null;
    }

    async findByIdOrUsername(idOrUsername: string): Promise<UserEntity | null> {
        let user: User | null = null;

        if (isUUID(idOrUsername)) {
            // Try to find by ID first
            user = await this.prisma.user.findUnique({
                where: { id: idOrUsername },
            });
        }

        if (!user) {
            // Try to find by username
            user = await this.prisma.user.findUnique({
                where: { username: idOrUsername },
            });
        }

        return user ? new UserEntity(this.mapUserToEntity(user)) : null;
    }

    async findByUsernameOrEmail(identifier: string): Promise<UserEntity | null> {
        const user: User | null = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { username: identifier }],
            },
        });
        return user ? new UserEntity(this.mapUserToEntity(user)) : null;
    }

    async create(data: CreateUserData): Promise<UserEntity> {
        const user: User = await this.prisma.user.create({
            data: {
                username: data.username,
                fullName: data.fullName,
                email: data.email,
                password: data.password,
                gender: data.gender,
                phone: data.phone ?? null,
                avatar: toJsonInput(data.avatar),
                provider: data.provider ?? 'LOCAL',
            },
        });
        return new UserEntity(this.mapUserToEntity(user));
    }

    async update(id: string, data: UpdateProfileData): Promise<UserEntity> {
        const user: User = await this.prisma.user.update({
            where: { id },
            data: {
                fullName: data.fullName,
                phone: data.phone,
                gender: data.gender,
                avatar: toJsonInput(data.avatar),
                background: toJsonInput(data.background),
                address: data.address,
                shortDescription: data.shortDescription,
                trustScore: data.trustScore,
                password: data.password,
                refreshToken: data.refreshToken,
                verifiedAt: data.verifiedAt,
            },
        });
        return new UserEntity(this.mapUserToEntity(user));
    }

    async updateAvatar(id: string, avatarData: CloudinaryImageData | null): Promise<UserEntity> {
        const user: User = await this.prisma.user.update({
            where: { id },
            data: { avatar: toJsonInput(avatarData) },
        });
        return new UserEntity(this.mapUserToEntity(user));
    }

    async updateBackground(
        id: string,
        backgroundData: CloudinaryImageData | null,
    ): Promise<UserEntity> {
        const user: User = await this.prisma.user.update({
            where: { id },
            data: { background: toJsonInput(backgroundData) },
        });
        return new UserEntity(this.mapUserToEntity(user));
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
    }

    async deleteUnverifiedUsers(olderThanMinutes: number): Promise<number> {
        const cutoffTime = new Date();
        cutoffTime.setMinutes(cutoffTime.getMinutes() - olderThanMinutes);

        const result = await this.prisma.user.deleteMany({
            where: {
                verifiedAt: null,
                provider: 'LOCAL',
                createdAt: { lt: cutoffTime },
            },
        });

        return result.count;
    }

    async countUnverifiedUsers(olderThanMinutes: number): Promise<number> {
        const cutoffTime = new Date();
        cutoffTime.setMinutes(cutoffTime.getMinutes() - olderThanMinutes);

        return this.prisma.user.count({
            where: {
                verifiedAt: null,
                provider: 'LOCAL',
                createdAt: { lt: cutoffTime },
            },
        });
    }

    async exists(id: string): Promise<boolean> {
        const count: number = await this.prisma.user.count({
            where: { id },
        });
        return count > 0;
    }

    async emailExists(email: string): Promise<boolean> {
        const count: number = await this.prisma.user.count({
            where: { email },
        });
        return count > 0;
    }

    async usernameExists(username: string): Promise<boolean> {
        const count: number = await this.prisma.user.count({
            where: { username },
        });
        return count > 0;
    }

    /**
     * Maps Prisma User to UserEntityProps, handling JSONB avatar/background fields
     */
    private mapUserToEntity(user: User): UserEntity {
        return {
            ...user,
            avatar: user.avatar as CloudinaryImageData | null,
            background: user.background as CloudinaryImageData | null,
        } as UserEntity;
    }
}
