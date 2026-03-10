import { Injectable } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { PaginationQueryDto } from '@follows/dto';

@Injectable()
export class GetTopAuthorsPaginatedService {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(query: PaginationQueryDto, currentUserId?: string) {
        const limit = query.limit || 10;
        const offset = query.offset || 0;
        const result = await this.userRepository.getTopAuthorsPaginated(
            limit,
            offset,
            currentUserId,
        );
        return {
            ...result,
            limit,
            offset,
        };
    }
}
