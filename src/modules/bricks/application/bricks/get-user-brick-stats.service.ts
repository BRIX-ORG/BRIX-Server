import { Injectable } from '@nestjs/common';
import { FindUserService } from '@users/application';
import { BrickRepository } from '@bricks/infrastructure';
import { UserBrickStatsResponseDto } from '@bricks/dto';

@Injectable()
export class GetUserBrickStatsService {
    constructor(
        private readonly brickRepository: BrickRepository,
        private readonly findUserService: FindUserService,
    ) {}

    async execute(idOrUsername: string): Promise<UserBrickStatsResponseDto> {
        // Resolve userId from idOrUsername
        const user = await this.findUserService.findByIdOrUsername(idOrUsername);
        const userId = user.id;

        // Fetch aggregated stats
        const stats = await this.brickRepository.getUserBrickStats(userId);

        // Process tag types
        const tagTypeStats = {
            REALTIME: 0,
            ART: 0,
            PRODUCT: 0,
        };

        for (const group of stats.tagTypeGroups) {
            if (group.tagType) {
                tagTypeStats[group.tagType] = group._count;
            }
        }

        // Process total donations
        let donationsTotal = 0;
        if (stats.totalDonations) {
            donationsTotal = Number(stats.totalDonations);
        }

        return {
            totalBricksUploaded: stats.totalBricks,
            ipfsBricksUploaded: stats.ipfsBricks,
            onchainBricks: stats.onchainBricks,
            totalUpvotes: stats.totalUpvotes,
            totalDonationsReceived: donationsTotal.toString(),
            bricksByTagType: tagTypeStats,
        };
    }
}
