import { Injectable } from '@nestjs/common';
import { BrickRepository } from '@bricks/infrastructure';
import { GetBrickLocationsDto } from '@bricks/dto';

@Injectable()
export class GetBrickLocationsService {
    constructor(private readonly brickRepository: BrickRepository) {}

    async execute(dto: GetBrickLocationsDto, userId?: string) {
        return this.brickRepository.findBrickLocations({
            isPublic: dto.isPublic,
            tagType: dto.tagType,
            userId, // if provided, limits results to this user
        });
    }
}
