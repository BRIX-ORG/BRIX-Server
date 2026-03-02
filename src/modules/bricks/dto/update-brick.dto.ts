import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBrickDto {
    @ApiPropertyOptional({ description: 'New title', example: 'My updated brick' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: 'New description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Toggle public visibility', example: true })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: { value: unknown }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return undefined;
    })
    isPublic?: boolean;
}
