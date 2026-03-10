import { ApiPropertyOptional } from '@nestjs/swagger';
import { TagType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class GetBrickLocationsDto {
    @ApiPropertyOptional({
        enum: TagType,
        description: 'Filter by tag type. Omit to return all types.',
    })
    @IsOptional()
    @IsEnum(TagType)
    tagType?: TagType;

    @ApiPropertyOptional({
        description: 'Filter by public status. Omit to return both public and private.',
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isPublic?: boolean;
}
