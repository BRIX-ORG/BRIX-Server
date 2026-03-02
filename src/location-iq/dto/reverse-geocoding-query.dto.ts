import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsInt, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ReverseGeocodingQueryDto {
    @ApiProperty({
        description: 'Latitude of the location',
        example: 48.8584,
    })
    @IsNumber()
    @Type(() => Number)
    lat: number;

    @ApiProperty({
        description: 'Longitude of the location',
        example: 2.2945,
    })
    @IsNumber()
    @Type(() => Number)
    lon: number;

    @ApiPropertyOptional({
        description: 'Include a breakdown of the address into elements',
        example: 1,
        enum: [0, 1],
        default: 1,
    })
    @IsOptional()
    @IsInt()
    @IsIn([0, 1])
    @Type(() => Number)
    addressdetails?: number = 1;

    @ApiPropertyOptional({
        description: 'Preferred language for showing search results',
        example: 'en',
    })
    @IsOptional()
    @IsString()
    lang?: string = 'en';

    @ApiPropertyOptional({
        description:
            'Makes parsing of the address object easier by returning a predictable list of elements',
        example: 1,
        enum: [0, 1],
        default: 1,
    })
    @IsOptional()
    @IsInt()
    @IsIn([0, 1])
    @Type(() => Number)
    normalizeaddress?: number = 1;
}
