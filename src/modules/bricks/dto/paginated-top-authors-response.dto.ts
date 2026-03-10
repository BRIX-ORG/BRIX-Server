import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TopAuthorResponseDto } from './top-author-response.dto';

export class PaginatedTopAuthorsResponseDto {
    @ApiProperty({ type: [TopAuthorResponseDto] })
    data: TopAuthorResponseDto[];

    @ApiProperty()
    total: number;

    @ApiPropertyOptional()
    limit: number | null;

    @ApiProperty()
    offset: number;
}
