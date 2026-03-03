import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TagType } from '@prisma/client';
import { FindUserService } from '@users/application';

@Injectable()
export class GetBricksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly findUserService: FindUserService,
    ) {}

    async execute(
        idOrUsername: string,
        requesterId: string | undefined,
        tagType?: TagType,
        limit: number = 20,
        offset: number = 0,
    ) {
        // Find user by id or username
        const user = await this.findUserService.findByIdOrUsername(idOrUsername);
        const userId = user.id;

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
