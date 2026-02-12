import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findGroup(
        recipientId: string,
        type: NotificationType,
        brickId?: string,
        commentId?: string,
    ) {
        // Query group matching criteria within 10 minutes window
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
                                },
                            },
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                ...(limit && { take: limit }),
                skip: offset,
            }),
            this.prisma.notificationGroup.count({ where: { recipientId } }),
        ]);

        return { notifications, total };
    }

    async markAsRead(id: string, recipientId: string) {
        return this.prisma.notificationGroup.update({
            where: { id, recipientId },
            data: { isRead: true },
        });
    }

    async delete(id: string, recipientId: string) {
        return this.prisma.notificationGroup.delete({
            where: { id, recipientId },
        });
    }
}
