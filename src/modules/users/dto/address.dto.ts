import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class AddressDto {
    @ApiProperty({
        example: '10.762622',
        description: 'Latitude coordinate',
    })
    @IsString()
    lat: string;

    @ApiProperty({
        example: '106.660172',
        description: 'Longitude coordinate',
    })
    @IsString()
    lon: string;

    @ApiProperty({
        example: 'Ho Chi Minh City, Vietnam',
        description: 'Full display name of the address',
    })
    @IsString()
    @MaxLength(300, { message: 'Display name cannot exceed 300 characters' })
    displayName: string;

    @ApiPropertyOptional({
        example: 'Vietnam',
        description: 'Country name',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Country cannot exceed 100 characters' })
    country?: string;
}
