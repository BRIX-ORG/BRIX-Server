import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface VoteResult {
    liked: boolean;
    count: number;
}

@Injectable()
export class VoteRepository {
    constructor(private readonly prisma: PrismaService) {}

    async toggleLike(brickId: string, userId: string): Promise<VoteResult> {
        const existing = await this.prisma.brickVote.findUnique({
            where: { brickId_userId: { brickId, userId } },
        });

        if (existing) {
            await this.prisma.brickVote.delete({
                where: { brickId_userId: { brickId, userId } },
            });
        } else {
            await this.prisma.brickVote.create({
                data: { brickId, userId, value: 1 },
            });
        }

        const count = await this.prisma.brickVote.count({ where: { brickId } });
        return { liked: !existing, count };
    }

    async getLikeStatus(brickId: string, userId: string): Promise<VoteResult> {
        const [existing, count] = await Promise.all([
            this.prisma.brickVote.findUnique({
                where: { brickId_userId: { brickId, userId } },
            }),
            this.prisma.brickVote.count({ where: { brickId } }),
        ]);

        return { liked: !!existing, count };
    }
}
