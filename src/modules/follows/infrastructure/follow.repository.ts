import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FollowerInfo, PaginatedResult, PaginationOptions } from '@follows/domain';

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

    async getAllFollowingIds(userId: string): Promise<string[]> {
        const following = await this.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        return following.map((f) => f.followingId);
    }

    async getRecommendations(userId: string, limit: number): Promise<string[]> {
        // Find users that the people I follow are following.
        // Exclude myself and people I am already following.

        // 1. Get all IDs I currently follow
        const myFollowingIds = await this.getAllFollowingIds(userId);

        if (myFollowingIds.length === 0) {
            // If I don't follow anyone, just return random newest users (fallback)
            const newestUsers = await this.prisma.user.findMany({
                where: { id: { not: userId } },
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: { id: true },
            });
            return newestUsers.map((u) => u.id);
        }

        // 2. Query to find recommendations
        const result = await this.prisma.$queryRaw<
            Array<{ following_id: string; common_count: bigint }>
        >`
            SELECT f2.following_id, COUNT(f2.follower_id) as common_count
            FROM follows f1
            JOIN follows f2 ON f1.following_id = f2.follower_id
            WHERE f1.follower_id = CAST(${userId} AS uuid)
              AND f2.following_id != CAST(${userId} AS uuid)
              AND f2.following_id NOT IN (
                  SELECT following_id FROM follows WHERE follower_id = CAST(${userId} AS uuid)
              )
            GROUP BY f2.following_id
            ORDER BY common_count DESC
            LIMIT ${limit}
        `;

        if (result.length > 0) {
            return result.map((r) => r.following_id);
        }

        // Fallback: If no friends-of-friends exist, return newest users not followed yet
        const newestUsers = await this.prisma.user.findMany({
            where: {
                id: { notIn: [...myFollowingIds, userId] },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { id: true },
        });

        return newestUsers.map((u) => u.id);
    }
}
