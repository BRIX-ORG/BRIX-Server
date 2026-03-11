import { Injectable, NotFoundException } from '@nestjs/common';
import { AlbumRepository } from '@albums/infrastructure';
import { PrismaService } from '@/prisma';

@Injectable()
export class FindUserAlbumsService {
    constructor(
        private readonly albumRepository: AlbumRepository,
        private readonly prisma: PrismaService,
    ) {}

    async execute(idOrUsername: string, limit: number = 10, offset: number = 0) {
        // Resolve user ID from handle (id or username)
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { id: idOrUsername.match(/^[0-9a-fA-F-]{36}$/) ? idOrUsername : undefined },
                    { username: idOrUsername },
                ],
            },
            select: { id: true },
        });

        if (!user) throw new NotFoundException('User not found');

        const [data, total] = await this.albumRepository.findByUserId(user.id, limit, offset);

        return { data, total, limit, offset };
    }
}
