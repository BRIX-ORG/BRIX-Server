import { Injectable } from '@nestjs/common';
import { FollowRepository } from '@follows/infrastructure';
import { PaginationQueryDto } from '@follows/dto';

@Injectable()
export class GetTopFollowedUsersService {
    constructor(private readonly followRepository: FollowRepository) {}

    async execute(query: PaginationQueryDto, currentUserId?: string) {
        return this.followRepository.getTopFollowedUsers(
            { limit: query.limit || 10, offset: query.offset || 0 },
            currentUserId,
        );
    }
}
