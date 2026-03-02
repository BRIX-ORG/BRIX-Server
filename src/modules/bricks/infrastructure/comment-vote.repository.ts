import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface CommentVoteResult {
    liked: boolean;
    count: number;
}

@Injectable()
export class CommentVoteRepository {
    constructor(private readonly prisma: PrismaService) {}

    async toggleLike(commentId: string, userId: string): Promise<CommentVoteResult> {
        const existing = await this.prisma.commentVote.findUnique({
            where: { commentId_userId: { commentId, userId } },
        });

        if (existing) {
            await this.prisma.commentVote.delete({
                where: { commentId_userId: { commentId, userId } },
            });
        } else {
            await this.prisma.commentVote.create({
                data: { commentId, userId, value: 1 },
            });
        }

        const count = await this.prisma.commentVote.count({ where: { commentId } });
        return { liked: !existing, count };
    }

    async getLikeStatus(commentId: string, userId: string): Promise<CommentVoteResult> {
        const [existing, count] = await Promise.all([
            this.prisma.commentVote.findUnique({
                where: { commentId_userId: { commentId, userId } },
            }),
            this.prisma.commentVote.count({ where: { commentId } }),
        ]);

        return { liked: !!existing, count };
    }
}
