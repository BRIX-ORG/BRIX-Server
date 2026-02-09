import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowRepository, PaginatedResult } from '@follows/infrastructure';
import { FollowerInfo } from '@follows/domain';
import { FindUserService } from '@users/application';

@Injectable()
export class GetFollowingService {
    constructor(
        private readonly followRepository: FollowRepository,
        private readonly findUserService: FindUserService,
    ) {}

    async execute(
        idOrUsername: string,
        options: { limit?: number; offset?: number } = {},
        currentUserId?: string,
    ): Promise<PaginatedResult<FollowerInfo>> {
        // Find user by id or username
        const user = await this.findUserService.findByIdOrUsername(idOrUsername);
        if (!user) {
            throw new NotFoundException(`User "${idOrUsername}" not found`);
        }

        return this.followRepository.getFollowing(user.id, options, currentUserId);
    }
}
