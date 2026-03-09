import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationGroupDto } from '@notifications/dto';

@Injectable()
export class NotificationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findGroup(
        recipientId: string,
        type: NotificationType,
        brickId?: string,
        commentId?: string,
    ) {
        return this.prisma.notificationGroup.findFirst({
            where: {
                recipientId,
                type,
                brickId: brickId ?? null,
                commentId: commentId ?? null,
                isRead: false,
                updatedAt: {
                    gte: new Date(Date.now() - 10 * 60 * 1000),
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async createGroup(data: {
        recipientId: string;
        type: NotificationType;
        brickId?: string;
        commentId?: string;
        actorsCount: number;
        lastActorId: string;
    }) {
        return this.prisma.notificationGroup.create({
            data,
            include: {
                lastActor: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
                brick: {
                    select: {
                        id: true,
                        title: true,
                        watermark: true,
                        mediaType: true,
                    },
                },
                comment: {
                    select: {
                        id: true,
                        content: true,
                        type: true,
                    },
                },
            },
        });
    }

    async incrementGroup(
        groupId: string,
        data: {
            delta: number;
            lastActorId: string;
        },
    ) {
        return this.prisma.notificationGroup.update({
            where: { id: groupId },
            data: {
                actorsCount: { increment: data.delta },
                lastActorId: data.lastActorId,
                updatedAt: new Date(),
            },
            include: {
                lastActor: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
                brick: {
                    select: {
                        id: true,
                        title: true,
                        watermark: true,
                        mediaType: true,
                    },
                },
                comment: {
                    select: {
                        id: true,
                        content: true,
                        type: true,
                    },
                },
            },
        });
    }

    async addActors(notificationGroupId: string, actorIds: string[]) {
        const data = actorIds.map((actorId) => ({
            notificationGroupId,
            actorId,
        }));

        return this.prisma.notificationActor.createMany({
            data,
            skipDuplicates: true,
        });
    }

    async findMany(recipientId: string, limit?: number, offset: number = 0) {
        const [notifications, total] = await Promise.all([
            this.prisma.notificationGroup.findMany({
                where: { recipientId },
                include: {
                    lastActor: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            gender: true,
                        },
                    },
                    actors: {
                        take: 3,
                        include: {
                            actor: {
                                select: {
                                    id: true,
                                    username: true,
                                    fullName: true,
                                    gender: true,
                                },
                            },
                        },
                    },
                    brick: {
                        select: {
                            id: true,
                            title: true,
                            watermark: true,
                            mediaType: true,
                        },
                    },
                    comment: {
                        select: {
                            id: true,
                            content: true,
                            type: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                ...(limit && { take: limit }),
                skip: offset,
            }),
            this.prisma.notificationGroup.count({ where: { recipientId } }),
        ]);

        return { notifications: notifications as unknown as NotificationGroupDto[], total };
    }

    async countUnread(recipientId: string): Promise<number> {
        return this.prisma.notificationGroup.count({
            where: { recipientId, isRead: false },
        });
    }

    async markAsRead(id: string, recipientId: string) {
        return this.prisma.notificationGroup.update({
            where: { id, recipientId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(recipientId: string) {
        return this.prisma.notificationGroup.updateMany({
            where: { recipientId, isRead: false },
            data: { isRead: true },
        });
    }

    async delete(id: string, recipientId: string) {
        return this.prisma.notificationGroup.delete({
            where: { id, recipientId },
        });
    }
}
