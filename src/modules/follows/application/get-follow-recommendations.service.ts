import { Injectable } from '@nestjs/common';
import { FollowRepository } from '@follows/infrastructure';
import { UserRepository } from '@users/infrastructure';
import { PaginationQueryDto, PaginatedFollowersResponseDto } from '@follows/dto';
import { UserEntity } from '@users/domain';
import { FollowerInfo } from '@follows/domain';

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

        // Fetch user basic info for these IDs
        // In a real app we might also want to return why they are recommended (e.g. mutual friends)
        // But for now we just return the users, mocking the "FollowerInfo" structure needed by dto.
        const users = await Promise.all(
            recommendedIds.map((id) => this.userRepository.findById(id)),
        );

        // Filter out any nulls incase of race conditions
        const validUsers = users.filter((u): u is UserEntity => u !== null);

        const followerInfoList: FollowerInfo[] = validUsers.map((u) => ({
            id: u.id,
            username: u.username,
            fullName: u.fullName,
            avatar: u.avatar,
            gender: u.gender,
            role: u.role,
            provider: u.provider,
            shortDescription: u.shortDescription,
            isFollowing: false, // Since they are recommendations, we know we aren't following them yet
        }));

        return {
            data: followerInfoList,
            total: followerInfoList.length,
            limit,
            offset: 0,
        };
    }
}
