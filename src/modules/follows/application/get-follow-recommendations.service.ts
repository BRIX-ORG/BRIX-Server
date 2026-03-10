import { Injectable } from '@nestjs/common';
import { FollowRepository } from '@follows/infrastructure';
import { UserRepository } from '@users/infrastructure';
import { PaginationQueryDto, PaginatedFollowersResponseDto } from '@follows/dto';

@Injectable()
export class GetFollowRecommendationsService {
    constructor(
        private readonly followRepository: FollowRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        userId: string,
        query: PaginationQueryDto,
    ): Promise<PaginatedFollowersResponseDto> {
        const limit = query.limit || 20;

        const recommendedIds = await this.followRepository.getRecommendations(userId, limit);

        if (recommendedIds.length === 0) {
            return {
                data: [],
                total: 0,
                limit,
                offset: 0,
            };
        }

        // Fetch full info for these IDs using the repository (includes counts and following status)
        const followerInfoList = await this.followRepository.getFollowerInfos(
            recommendedIds,
            userId,
        );

        return {
            data: followerInfoList,
            total: followerInfoList.length,
            limit,
            offset: 0,
        };
    }
}
