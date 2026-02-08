import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, MaxLength, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AutocompleteQueryDto {
    @ApiProperty({
        description: 'Search query string',
        example: 'Empire State',
        maxLength: 200,
    })
    @IsString()
    @MaxLength(200)
    q: string;

    @ApiPropertyOptional({
        description: 'Limit the number of returned results',
        example: 10,
        minimum: 1,
        maximum: 20,
        default: 10,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(20)
    @Type(() => Number)
    limit?: number = 10;

    @ApiPropertyOptional({
        description:
            'Limit search to specific countries (comma-separated ISO 3166-1 alpha-2 codes)',
        example: 'vn,us',
    })
    @IsOptional()
    @IsString()
    countrycodes?: string;

    @ApiPropertyOptional({
        description:
            'Normalize city value from address section. If no city, uses city_district, locality, town, etc.',
        example: 1,
        enum: [0, 1],
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @IsIn([0, 1])
    @Type(() => Number)
    normalizecity?: number = 0;

    @ApiPropertyOptional({
        description: 'Preferred language for showing search results (2-digit language code)',
        example: 'en',
        enum: ['en', 'cs', 'nl', 'fr', 'de', 'id', 'it', 'no', 'pl', 'es', 'ru', 'sv', 'uk', 'vi'],
        default: 'en',
    })
    @IsOptional()
    @IsString()
    @IsIn(['en', 'cs', 'nl', 'fr', 'de', 'id', 'it', 'no', 'pl', 'es', 'ru', 'sv', 'uk', 'vi'])
    lang?: string = 'en';
}
