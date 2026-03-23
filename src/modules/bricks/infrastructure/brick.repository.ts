import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Brick, Prisma, TagType } from '@prisma/client';
import {
    CreateBrickData,
    FindBricksFilter,
    FindNewsfeedBricksFilter,
    FindBrickLocationsFilter,
    FindFollowingBricksFilter,
} from '@bricks/domain';

@Injectable()
export class BrickRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateBrickData): Promise<Brick> {
        return this.prisma.brick.create({
            data: {
                userId: data.userId,
                media: data.media as object,
                watermark: data.watermark ? (data.watermark as object) : undefined,
                thumbnail: data.thumbnail ? (data.thumbnail as object) : undefined,
                title: data.title,
                description: data.description,
                mediaType: data.mediaType,
                tagType: data.tagType,
                isPublic: data.isPublic ?? true,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
            },
        });
    }

    async findById(id: string): Promise<Brick | null> {
        return this.prisma.brick.findUnique({
            where: { id },
        });
    }

    async findByIdWithUser(id: string) {
        return this.prisma.brick.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                        gender: true,
                    },
                },
                metadata: true,
                _count: {
                    select: {
                        votes: true,
                        comments: true,
                    },
                },
            },
        });
    }

    async findByUserId(userId: string): Promise<Brick[]> {
        return this.prisma.brick.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findManyWithMetadata(
        filter: FindBricksFilter,
        limit: number,
        offset: number,
    ): Promise<[Brick[], number]> {
        const where = {
            userId: filter.userId,
            ...(filter.isPublic !== undefined ? { isPublic: filter.isPublic } : {}),
            ...(filter.tagType ? { tagType: filter.tagType } : {}),
        };

        return Promise.all([
            this.prisma.brick.findMany({
                where,
                include: { metadata: true },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.brick.count({ where }),
        ]);
    }

    async update(id: string, data: Prisma.BrickUpdateInput): Promise<Brick> {
        return this.prisma.brick.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<Brick> {
        return this.prisma.brick.delete({
            where: { id },
        });
    }

    async findNewsfeedBricks(filter: FindNewsfeedBricksFilter): Promise<[Brick[], number]> {
        const where: Prisma.BrickWhereInput = {};

        if (filter.isPublic !== undefined) {
            where.isPublic = filter.isPublic;
        }

        if (filter.tagType) {
            where.tagType = filter.tagType;
        }

        if (filter.timeRange && filter.timeRange !== 'ALL') {
            const now = new Date();
            let startDate: Date;

            if (filter.timeRange === 'DAY') {
                startDate = new Date(now.setHours(0, 0, 0, 0));
            } else if (filter.timeRange === 'WEEK') {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                startDate = new Date(now.setDate(diff));
                startDate.setHours(0, 0, 0, 0);
            } else if (filter.timeRange === 'MONTH') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            if (startDate!) {
                where.createdAt = { gte: startDate };
            }
        }

        return Promise.all([
            this.prisma.brick.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            gender: true,
                        },
                    },
                    metadata: true,
                    _count: {
                        select: {
                            votes: true,
                            comments: true,
                        },
                    },
                },
                orderBy: {
                    votes: {
                        _count: 'desc',
                    },
                },
                take: filter.limit,
                skip: filter.offset,
            }),
            this.prisma.brick.count({ where }),
        ]);
    }

    async findBrickLocations(filter: FindBrickLocationsFilter): Promise<Partial<Brick>[]> {
        const where: Prisma.BrickWhereInput = {
            latitude: { not: null },
            longitude: { not: null },
        };

        if (filter.userId) {
            where.userId = filter.userId;
        }

        if (filter.isPublic !== undefined) {
            where.isPublic = filter.isPublic;
        }

        if (filter.tagType) {
            where.tagType = filter.tagType;
        }

        return this.prisma.brick.findMany({
            where,
            select: {
                id: true,
                latitude: true,
                longitude: true,
                tagType: true,
            },
        });
    }

    async findFollowingBricks(filter: FindFollowingBricksFilter): Promise<[Brick[], number]> {
        const where: Prisma.BrickWhereInput = {
            userId: { in: filter.userIds },
        };

        if (filter.isPublic !== undefined) {
            where.isPublic = filter.isPublic;
        }

        if (filter.tagType) {
            where.tagType = filter.tagType;
        }

        return Promise.all([
            this.prisma.brick.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            gender: true,
                        },
                    },
                    metadata: true,
                    _count: {
                        select: {
                            votes: true,
                            comments: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: filter.limit,
                skip: filter.offset,
            }),
            this.prisma.brick.count({ where }),
        ]);
    }

    async findUserRealtimeBricks(
        userId: string,
        onChainStatus?: string,
        limit: number = 20,
        offset: number = 0,
    ) {
        const where: Prisma.BrickWhereInput = {
            userId,
            tagType: TagType.REALTIME,
        };

        if (onChainStatus) {
            where.metadata = {
                onChainStatus,
            };
        }

        return Promise.all([
            this.prisma.brick.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            gender: true,
                        },
                    },
                    metadata: true,
                    donations: {
                        select: {
                            amount: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.brick.count({ where }),
        ]);
    }

    async getUserBrickStats(userId: string) {
        const [totalBricks, ipfsBricks, onchainBricks, totalUpvotes, tagTypeGroups, donationsSum] =
            await Promise.all([
                this.prisma.brick.count({ where: { userId } }),
                this.prisma.brick.count({
                    where: { userId, metadata: { ipfsCid: { not: null } } },
                }),
                this.prisma.brick.count({
                    where: { userId, metadata: { onChainStatus: 'onchain' } },
                }),
                this.prisma.brickVote.count({
                    where: { brick: { userId }, value: 1 },
                }),
                this.prisma.brick.groupBy({
                    by: ['tagType'],
                    where: { userId },
                    _count: true,
                }),
                this.prisma.donation.aggregate({
                    where: { brick: { userId } },
                    _sum: { amount: true },
                }),
            ]);

        return {
            totalBricks,
            ipfsBricks,
            onchainBricks,
            totalUpvotes,
            tagTypeGroups,
            totalDonations: donationsSum._sum.amount,
        };
    }
}
