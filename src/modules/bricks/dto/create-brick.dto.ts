import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateBrickDto {
    @ApiProperty({ description: 'Title of the brick' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiPropertyOptional({ description: 'Description of the brick' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Address/location name' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Latitude', example: 10.762622 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude', example: 106.660172 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    longitude?: number;

    @ApiPropertyOptional({
        description: 'Whether the brick is public (default: true)',
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: { value: unknown }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return true; // default
    })
    isPublic?: boolean;
}
