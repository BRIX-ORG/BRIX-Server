import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowerResponseDto } from './follow-response.dto';

export class TopFollowerResponseDto extends FollowerResponseDto {}

export class PaginatedTopFollowersResponseDto {
    @ApiProperty({ type: [TopFollowerResponseDto] })
    data: TopFollowerResponseDto[];

    @ApiProperty()
    total: number;

    @ApiPropertyOptional()
    limit: number | null;

    @ApiProperty()
    offset: number;
}
