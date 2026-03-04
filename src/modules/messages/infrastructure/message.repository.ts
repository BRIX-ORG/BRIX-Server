import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateMessageData {
    conversationId: string;
    senderId: string;
    content?: string;
    images?: any;
    voice?: any;
    file?: any;
    brickId?: string;
}

@Injectable()
export class MessageRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateMessageData) {
        return this.prisma.message.create({
            data: {
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                images: data.images ? (data.images as Prisma.InputJsonValue) : undefined,
                voice: data.voice ? (data.voice as Prisma.InputJsonValue) : undefined,
                file: data.file ? (data.file as Prisma.InputJsonValue) : undefined,
                brickId: data.brickId,
            },
        });
    }

    async findById(id: string) {
        return this.prisma.message.findUnique({
            where: { id },
        });
    }

    /**
     * Get paginated messages in a conversation, sorted by createdAt desc.
     * Excludes soft-deleted messages.
     */
    async findByConversationId(conversationId: string, limit: number = 30, offset: number = 0) {
        const where = { conversationId, deletedAt: null };

        const [data, total] = await Promise.all([
            this.prisma.message.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.message.count({ where }),
        ]);

        return { data, total, limit, offset };
    }

    /**
     * Update message content (text only).
     */
    async updateContent(id: string, content: string) {
        return this.prisma.message.update({
            where: { id },
            data: { content },
        });
    }

    /**
     * Soft delete a message.
     */
    async softDelete(id: string) {
        return this.prisma.message.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Update reactions for a message.
     */
    async updateReactions(id: string, reactions: any) {
        return this.prisma.message.update({
            where: { id },
            data: { reactions: reactions as Prisma.InputJsonValue },
        });
    }

    /**
     * Mark all unread messages as read for a user in a conversation.
     * Only marks messages sent by the OTHER user (not the reader).
     */
    async markAsRead(conversationId: string, userId: string) {
        return this.prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false,
                deletedAt: null,
            },
            data: { isRead: true },
        });
    }

    /**
     * Count total unread messages across all conversations for a user.
     */
    async countUnread(userId: string): Promise<number> {
        return this.prisma.message.count({
            where: {
                conversation: {
                    OR: [{ user1Id: userId }, { user2Id: userId }],
                },
                senderId: { not: userId },
                isRead: false,
                deletedAt: null,
            },
        });
    }

    /**
     * Count unread messages in a specific conversation for a user.
     */
    async countUnreadByConversation(conversationId: string, userId: string): Promise<number> {
        return this.prisma.message.count({
            where: {
                conversationId,
                senderId: { not: userId },
                isRead: false,
                deletedAt: null,
            },
        });
    }

    /**
     * Get messages with images in a conversation (paginated).
     */
    async findImagesByConversation(conversationId: string, limit: number = 20, offset: number = 0) {
        const where = {
            conversationId,
            images: { not: Prisma.DbNull },
            deletedAt: null,
        };

        const [data, total] = await Promise.all([
            this.prisma.message.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
                select: {
                    id: true,
                    senderId: true,
                    images: true,
                    createdAt: true,
                },
            }),
            this.prisma.message.count({ where }),
        ]);

        return { data, total, limit, offset };
    }

    /**
     * Get messages with files in a conversation (paginated).
     */
    async findFilesByConversation(conversationId: string, limit: number = 20, offset: number = 0) {
        const where = {
            conversationId,
            file: { not: Prisma.DbNull },
            deletedAt: null,
        };

        const [data, total] = await Promise.all([
            this.prisma.message.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
                select: {
                    id: true,
                    senderId: true,
                    file: true,
                    createdAt: true,
                },
            }),
            this.prisma.message.count({ where }),
        ]);

        return { data, total, limit, offset };
    }
}
