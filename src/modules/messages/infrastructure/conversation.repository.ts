import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ConversationRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Find or create a conversation between two users.
     * Always stores user1Id < user2Id for consistent uniqueness.
     */
    async findOrCreate(userAId: string, userBId: string) {
        const [user1Id, user2Id] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];

        const existing = await this.prisma.conversation.findUnique({
            where: { user1Id_user2Id: { user1Id, user2Id } },
        });

        if (existing) return existing;

        return this.prisma.conversation.create({
            data: { user1Id, user2Id },
        });
    }

    /**
     * Find a conversation by ID with both users.
     */
    async findById(id: string) {
        return this.prisma.conversation.findUnique({
            where: { id },
            include: {
                user1: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                        gender: true,
                        isOnline: true,
                        lastSeenAt: true,
                    },
                },
                user2: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                        gender: true,
                        isOnline: true,
                        lastSeenAt: true,
                    },
                },
            },
        });
    }

    /**
     * Get paginated conversations for a user, sorted by updatedAt desc.
     * Includes last message and partner user info.
     */
    async findByUserId(userId: string, limit: number = 20, offset: number = 0) {
        const where = {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            // Exclude hidden conversations
            AND: [
                {
                    OR: [
                        { user1Id: userId, user1HiddenAt: null },
                        { user2Id: userId, user2HiddenAt: null },
                        // Include unhidden partner side
                        { user1Id: { not: userId } },
                        { user2Id: { not: userId } },
                    ],
                },
            ],
        };

        const [data, total] = await Promise.all([
            this.prisma.conversation.findMany({
                where,
                include: {
                    user1: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            gender: true,
                            isOnline: true,
                            lastSeenAt: true,
                        },
                    },
                    user2: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                            gender: true,
                            isOnline: true,
                            lastSeenAt: true,
                        },
                    },
                    messages: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.conversation.count({ where }),
        ]);

        return { data, total, limit, offset };
    }

    /**
     * Update updatedAt timestamp for a conversation.
     */
    async touch(id: string) {
        return this.prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        });
    }
}
