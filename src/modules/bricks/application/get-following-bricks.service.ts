import { Injectable } from '@nestjs/common';
import { BrickRepository } from '@bricks/infrastructure';
import { GetFollowingBricksDto } from '@bricks/dto';
import { FollowRepository } from '@follows/infrastructure';

@Injectable()
export class GetFollowingBricksService {
    constructor(
        private readonly brickRepository: BrickRepository,
        private readonly followRepository: FollowRepository,
    ) {}

    async execute(userId: string, dto: GetFollowingBricksDto) {
        const followingIds = await this.followRepository.getAllFollowingIds(userId);

        if (followingIds.length === 0) {
            return { data: [], total: 0, limit: dto.limit ?? 20, offset: dto.offset ?? 0 };
        }

        const [data, total] = await this.brickRepository.findFollowingBricks({
            userIds: followingIds,
            isPublic: dto.isPublic,
            tagType: dto.tagType,
            limit: dto.limit ?? 20,
            offset: dto.offset ?? 0,
        });

        return { data, total, limit: dto.limit ?? 20, offset: dto.offset ?? 0 };
    }
}
