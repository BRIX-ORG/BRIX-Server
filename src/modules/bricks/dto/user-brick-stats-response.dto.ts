import { ApiProperty } from '@nestjs/swagger';

export class BrickTagTypeStatsDto {
    @ApiProperty()
    REALTIME: number;

    @ApiProperty()
    ART: number;

    @ApiProperty()
    PRODUCT: number;
}

export class UserBrickStatsResponseDto {
    @ApiProperty({ description: 'Total number of bricks uploaded by user' })
    totalBricksUploaded: number;

    @ApiProperty({ description: 'Number of bricks currently sitting on IPFS' })
    ipfsBricksUploaded: number;

    @ApiProperty({ description: 'Number of bricks successfully minted on-chain' })
    onchainBricks: number;

    @ApiProperty({ description: 'Total number of upvotes received across all bricks' })
    totalUpvotes: number;

    @ApiProperty({ description: 'Total amount of POL donations received', type: String })
    totalDonationsReceived: string;

    @ApiProperty({ description: 'Breakdown of brick count by tag type' })
    bricksByTagType: BrickTagTypeStatsDto;
}
