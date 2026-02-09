import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FollowerInfo } from '@follows/domain';

export interface PaginationOptions {
    limit?: number;
    offset?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    limit: number | null;
    offset: number;
}

@Injectable()
export class FollowRepository {
    constructor(private readonly prisma: PrismaService) {}

    async follow(followerId: string, followingId: string): Promise<void> {
        await this.prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });
    }

    async unfollow(followerId: string, followingId: string): Promise<void> {
        await this.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        return !!follow;
    }

    async getFollowers(
        userId: string,
        options: PaginationOptions = {},
        currentUserId?: string,
    ): Promise<PaginatedResult<FollowerInfo>> {
        const { limit, offset = 0 } = options;

        const [followers, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followingId: userId },
                include: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            gender: true,
                            role: true,
                            provider: true,
                            shortDescription: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                ...(limit !== undefined && { take: limit }),
                skip: offset,
            }),
            this.prisma.follow.count({ where: { followingId: userId } }),
        ]);

        // Check if current user follows each follower
        let followingMap: Map<string, boolean> = new Map();
        if (currentUserId) {
            const followingRelations = await this.prisma.follow.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: { in: followers.map((f) => f.follower.id) },
                },
                select: { followingId: true },
            });
            followingMap = new Map(followingRelations.map((r) => [r.followingId, true]));
        }

        return {
            data: followers.map((f) => ({
                ...f.follower,
                isFollowing: currentUserId ? (followingMap.get(f.follower.id) ?? false) : undefined,
            })),
            total,
            limit: limit ?? null,
            offset,
        };
    }

    async getFollowing(
        userId: string,
        options: PaginationOptions = {},
        currentUserId?: string,
    ): Promise<PaginatedResult<FollowerInfo>> {
        const { limit, offset = 0 } = options;

        const [following, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followerId: userId },
                include: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            gender: true,
                            role: true,
                            provider: true,
                            shortDescription: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                ...(limit !== undefined && { take: limit }),
                skip: offset,
            }),
            this.prisma.follow.count({ where: { followerId: userId } }),
        ]);

        // Check if current user follows each person
        let followingMap: Map<string, boolean> = new Map();
        if (currentUserId) {
            const followingRelations = await this.prisma.follow.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: { in: following.map((f) => f.following.id) },
                },
                select: { followingId: true },
            });
            followingMap = new Map(followingRelations.map((r) => [r.followingId, true]));
        }

        return {
            data: following.map((f) => ({
                ...f.following,
                isFollowing: currentUserId
                    ? (followingMap.get(f.following.id) ?? false)
                    : undefined,
            })),
            total,
            limit: limit ?? null,
            offset,
        };
    }

    async countFollowers(userId: string): Promise<number> {
        return this.prisma.follow.count({ where: { followingId: userId } });
    }

    async countFollowing(userId: string): Promise<number> {
        return this.prisma.follow.count({ where: { followerId: userId } });
    }
}
