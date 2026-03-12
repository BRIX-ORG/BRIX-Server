import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { VoteResult } from '@bricks/domain';

export type CommentVoteResult = VoteResult;

@Injectable()
export class CommentVoteRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Cast or toggle a vote on a comment.
     * - Same value as existing → remove vote (toggle off).
     * - Opposite value → update vote (flip).
     * - No existing vote → create.
     */
    async vote(commentId: string, userId: string, value: 1 | -1): Promise<CommentVoteResult> {
        const existing = await this.prisma.commentVote.findUnique({
            where: { commentId_userId: { commentId, userId } },
        });

        if (existing) {
            if (existing.value === value) {
                await this.prisma.commentVote.delete({
                    where: { commentId_userId: { commentId, userId } },
                });
            } else {
                await this.prisma.commentVote.update({
                    where: { commentId_userId: { commentId, userId } },
                    data: { value },
                });
            }
        } else {
            await this.prisma.commentVote.create({
                data: { commentId, userId, value },
            });
        }

        return this.getVoteStatus(commentId, userId);
    }

    async getVoteStatus(commentId: string, userId?: string): Promise<CommentVoteResult> {
        const [upvoteCount, downvoteCount, userVoteRecord] = await Promise.all([
            this.prisma.commentVote.count({ where: { commentId, value: 1 } }),
            this.prisma.commentVote.count({ where: { commentId, value: -1 } }),
            userId
                ? this.prisma.commentVote.findUnique({
                      where: { commentId_userId: { commentId, userId } },
                  })
                : null,
        ]);

        return {
            userVote: (userVoteRecord?.value ?? 0) as 1 | -1 | 0,
            upvoteCount,
            downvoteCount,
            score: upvoteCount - downvoteCount,
        };
    }

    async findUpvotersByCommentId(commentId: string) {
        const votes = await this.prisma.commentVote.findMany({
            where: { commentId, value: 1 },
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
            },
            orderBy: { createdAt: 'desc' },
        });

        return votes.map((v) => v.user);
    }
}
