import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { VoteResult } from '@bricks/domain';

export type BrickVoteResult = VoteResult;

@Injectable()
export class BrickVoteRepository {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Cast or toggle a vote on a brick.
     * - Same value as existing → remove vote (toggle off).
     * - Opposite value → update vote (flip).
     * - No existing vote → create.
     */
    async vote(brickId: string, userId: string, value: 1 | -1): Promise<BrickVoteResult> {
        const existing = await this.prisma.brickVote.findUnique({
            where: { brickId_userId: { brickId, userId } },
        });

        if (existing) {
            if (existing.value === value) {
                // Same vote → toggle off
                await this.prisma.brickVote.delete({
                    where: { brickId_userId: { brickId, userId } },
                });
            } else {
                // Opposite vote → flip
                await this.prisma.brickVote.update({
                    where: { brickId_userId: { brickId, userId } },
                    data: { value },
                });
            }
        } else {
            // No existing vote → create
            await this.prisma.brickVote.create({
                data: { brickId, userId, value },
            });
        }

        return this.getVoteStatus(brickId, userId);
    }

    async getVoteStatus(brickId: string, userId?: string): Promise<BrickVoteResult> {
        const [upvoteCount, downvoteCount, userVoteRecord] = await Promise.all([
            this.prisma.brickVote.count({ where: { brickId, value: 1 } }),
            this.prisma.brickVote.count({ where: { brickId, value: -1 } }),
            userId
                ? this.prisma.brickVote.findUnique({
                      where: { brickId_userId: { brickId, userId } },
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

    async findUpvotersByBrickId(brickId: string) {
        const votes = await this.prisma.brickVote.findMany({
            where: { brickId, value: 1 },
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
