import { Injectable } from '@nestjs/common';
import { FindUserService } from '@users/application';
import { BrickRepository } from '@bricks/infrastructure';
import { GetRealtimeBricksQueryDto } from '@bricks/dto';

@Injectable()
export class GetUserRealtimeBricksService {
    constructor(
        private readonly brickRepository: BrickRepository,
        private readonly findUserService: FindUserService,
    ) {}

    async execute(idOrUsername: string, query: GetRealtimeBricksQueryDto) {
        // Find user by id or username
        const user = await this.findUserService.findByIdOrUsername(idOrUsername);
        const userId = user.id;

        const { onChainStatus, limit, offset } = query;

        const [data, total] = await this.brickRepository.findUserRealtimeBricks(
            userId,
            onChainStatus,
            limit,
            offset,
        );

        return { data, total, limit: limit ?? 20, offset: offset ?? 0 };
    }
}
