import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';
import {
    UserEntity,
    CreateUserData,
    UpdateProfileData,
    CloudinaryImageData,
    AddressData,
} from '@users/domain';
import { Prisma, type User } from '@prisma/client';

// Helper function to check if string is a valid UUID
function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// Helper to convert JSON data to Prisma-compatible JSON input
function toJsonInput(
    data: CloudinaryImageData | AddressData | null | undefined,
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
                address: toJsonInput(data.address),
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

    async getTopAuthors(limit: number): Promise<{ user: UserEntity; totalVotes: number }[]> {
        // Raw SQL to:
        // 1. Join users, bricks, and brick_votes
        // 2. Count total upvotes (value = 1) across all an author's bricks
        // 3. Group by user, sort descending by the count, and take $limit

        const result = await this.prisma.$queryRaw<Array<{ id: string; total_votes: bigint }>>`
            SELECT u.id, COUNT(bv.id) AS total_votes
            FROM users u
            LEFT JOIN bricks b ON b.user_id = u.id AND b.is_public = true
            LEFT JOIN brick_votes bv ON bv.brick_id = b.id AND bv.value = 1
            GROUP BY u.id
            ORDER BY total_votes DESC
            LIMIT ${limit}
        `;

        if (!result.length) return [];

        const userIds = result.map((r) => r.id);

        // Fetch user details for the IDs
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
        });

        // Map them back to the sorted order with their votes
        return result.map((row) => {
            const user = users.find((u) => u.id === row.id)!;
            return {
                user: new UserEntity(this.mapUserToEntity(user)),
                totalVotes: Number(row.total_votes),
            };
        });
    }

    async getTopAuthorsPaginated(
        limit: number,
        offset: number = 0,
        currentUserId?: string,
    ): Promise<{
        data: { user: UserEntity; totalVotes: number; isFollowing?: boolean }[];
        total: number;
    }> {
        // 1. Get total count of users
        const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(id) as count
            FROM users
        `;

        const total = Number(countResult[0]?.count || 0);

        if (total === 0) {
            return { data: [], total: 0 };
        }

        // 2. Get paginated authors including those with 0 votes
        const result = await this.prisma.$queryRaw<Array<{ id: string; total_votes: bigint }>>`
            SELECT u.id, COUNT(bv.id) AS total_votes
            FROM users u
            LEFT JOIN bricks b ON b.user_id = u.id AND b.is_public = true
            LEFT JOIN brick_votes bv ON bv.brick_id = b.id AND bv.value = 1
            GROUP BY u.id
            ORDER BY total_votes DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `;

        if (!result.length) return { data: [], total };

        const userIds = result.map((r) => r.id);

        // Fetch user details
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
        });

        // Check if current user follows each author
        let followingMap: Map<string, boolean> = new Map();
        if (currentUserId) {
            const followingRelations = await this.prisma.follow.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: { in: userIds },
                },
                select: { followingId: true },
            });
            followingMap = new Map(followingRelations.map((r) => [r.followingId, true]));
        }

        // Map them back
        const data = result.map((row) => {
            const user = users.find((u) => u.id === row.id)!;
            return {
                user: new UserEntity(this.mapUserToEntity(user)),
                totalVotes: Number(row.total_votes),
                isFollowing: currentUserId ? (followingMap.get(user.id) ?? false) : undefined,
            };
        });

        return { data, total };
    }

    /**
     * Maps Prisma User to UserEntityProps, handling JSONB fields
     */
    private mapUserToEntity(user: User): UserEntity {
        return {
            ...user,
            avatar: user.avatar as CloudinaryImageData | null,
            background: user.background as CloudinaryImageData | null,
            address: user.address as AddressData | null,
        } as UserEntity;
    }
}
