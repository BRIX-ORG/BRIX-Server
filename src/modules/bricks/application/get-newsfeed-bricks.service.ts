import { Injectable } from '@nestjs/common';
import { BrickRepository } from '@bricks/infrastructure';
import { GetNewsfeedBricksDto } from '@bricks/dto';

@Injectable()
export class GetNewsfeedBricksService {
    constructor(private readonly brickRepository: BrickRepository) {}

    async execute(dto: GetNewsfeedBricksDto) {
        const [data, total] = await this.brickRepository.findNewsfeedBricks({
            isPublic: dto.isPublic,
            tagType: dto.tagType,
            timeRange: dto.timeRange,
            limit: dto.limit ?? 20,
            offset: dto.offset ?? 0,
        });

        return { data, total, limit: dto.limit ?? 20, offset: dto.offset ?? 0 };
    }
}
