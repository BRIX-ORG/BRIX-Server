import { ApiProperty } from '@nestjs/swagger';

export class VoteResponseDto {
    @ApiProperty({ description: 'Whether the current user has liked this item' })
    liked: boolean;

    @ApiProperty({ description: 'Total like count for this item' })
    count: number;
}
