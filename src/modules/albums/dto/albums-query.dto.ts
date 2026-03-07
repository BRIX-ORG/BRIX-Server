import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { AlbumResponseDto } from './album-response.dto';

export class AlbumsQueryDto {
    @ApiPropertyOptional({ default: 10, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ default: 0, minimum: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
}

export class PaginatedAlbumsResponseDto {
    @ApiProperty({ type: [AlbumResponseDto] })
    data: AlbumResponseDto[];

    @ApiProperty() total: number;
    @ApiProperty() limit: number;
    @ApiProperty() offset: number;
}
