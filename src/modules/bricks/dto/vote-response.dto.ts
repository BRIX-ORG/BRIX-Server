import { ApiProperty } from '@nestjs/swagger';

export class VoteResponseDto {
    @ApiProperty({
        description: 'Current user vote: 1 (upvote), -1 (downvote), 0 (no vote)',
        enum: [1, -1, 0],
        example: 1,
    })
    userVote: 1 | -1 | 0;

    @ApiProperty({ description: 'Total upvote count', example: 42 })
    upvoteCount: number;

    @ApiProperty({ description: 'Total downvote count', example: 3 })
    downvoteCount: number;

    @ApiProperty({ description: 'Net score (upvotes - downvotes)', example: 39 })
    score: number;
}
