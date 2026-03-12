import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCommentData } from '@bricks/domain';

export const commentWithDetails = {
    user: {
        select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            gender: true,
        },
    },
    _count: {
        select: { votes: true, replies: true },
    },
    replies: {
        orderBy: { createdAt: 'asc' as const },
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
            _count: {
                select: { votes: true },
            },
        },
    },
} satisfies Prisma.CommentInclude;

export type CommentWithDetails = Prisma.CommentGetPayload<{ include: typeof commentWithDetails }>;

@Injectable()
export class CommentRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateCommentData) {
        return this.prisma.comment.create({
            data: {
                brickId: data.brickId,
                userId: data.userId,
                content: data.content,
                type: data.type,
                parentId: data.parentId,
                images: data.images ? (data.images as object[]) : undefined,
            },
            include: commentWithDetails,
        });
    }

    async findById(id: string) {
        return this.prisma.comment.findUnique({
            where: { id },
            include: commentWithDetails,
        });
    }

    async findRootCommentsByBrick(brickId: string, limit: number = 20, cursor?: string) {
        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: { brickId, parentId: null },
                include: commentWithDetails,
                orderBy: { createdAt: 'desc' },
                take: limit,
                ...(cursor && { skip: 1, cursor: { id: cursor } }),
            }),
            this.prisma.comment.count({ where: { brickId, parentId: null } }),
        ]);

        return { comments, total };
    }

    async update(id: string, userId: string, content: string) {
        const comment = await this.prisma.comment.findUnique({ where: { id } });

        if (!comment) throw new NotFoundException('Comment not found');
        if (comment.userId !== userId)
            throw new ForbiddenException('Not authorized to edit this comment');

        return this.prisma.comment.update({
            where: { id },
            data: { content },
            include: commentWithDetails,
        });
    }

    async delete(id: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({ where: { id } });

        if (!comment) throw new NotFoundException('Comment not found');
        if (comment.userId !== userId)
            throw new ForbiddenException('Not authorized to delete this comment');

        return this.prisma.comment.delete({ where: { id } });
    }
}
