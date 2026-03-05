import { Injectable } from '@nestjs/common';
import { TagType } from '@prisma/client';
import { FindUserService } from '@users/application';
import { BrickRepository, FindBricksFilter } from '@bricks/infrastructure';

@Injectable()
export class GetBricksService {
    constructor(
        private readonly brickRepository: BrickRepository,
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

        const filter: FindBricksFilter = {
            userId,
            ...(isOwner ? {} : { isPublic: true }),
            tagType,
        };

        const [data, total] = await this.brickRepository.findManyWithMetadata(
            filter,
            limit,
            offset,
        );

        return { data, total, limit, offset };
    }
}
