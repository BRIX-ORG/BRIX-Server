import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';

export class CastVoteDto {
    @ApiProperty({
        description: 'Vote value: 1 for upvote, -1 for downvote',
        enum: [1, -1],
        example: 1,
    })
    @IsInt()
    @IsIn([1, -1])
    value: 1 | -1;
}
