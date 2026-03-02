import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TagType } from '@prisma/client';

@Injectable()
export class GetBricksService {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        requesterId: string | undefined,
        tagType?: TagType,
        limit: number = 20,
        offset: number = 0,
    ) {
        // If requester is the owner → see all bricks (public + private)
        // Otherwise → only public bricks
        const isOwner = requesterId === userId;

        const where = {
            userId,
            ...(isOwner ? {} : { isPublic: true }),
            ...(tagType ? { tagType } : {}),
        };

        const [data, total] = await Promise.all([
            this.prisma.brick.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.brick.count({ where }),
        ]);

        return { data, total, limit, offset };
    }
}
