import { ApiPropertyOptional } from '@nestjs/swagger';
import { TagType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class BricksQueryDto {
    @ApiPropertyOptional({
        enum: TagType,
        description: 'Filter by tag type. Omit to return all types.',
    })
    @IsOptional()
    @IsEnum(TagType)
    tagType?: TagType;

    @ApiPropertyOptional({ default: 20, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @ApiPropertyOptional({ default: 0, minimum: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
}
