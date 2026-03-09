import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    MaxLength,
    IsHexColor,
    IsArray,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';

export class UpdateAlbumDto {
    @ApiPropertyOptional({ description: 'New name for the album', example: 'New Summer Trip' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ description: 'New description for the album' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        description: 'Array of exactly 3 background colors (Hex)',
        example: ['#1a1a2e', '#16213e', '#0f3460'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(3)
    @ArrayMaxSize(3)
    @IsHexColor({ each: true })
    background?: string[];

    @ApiPropertyOptional({ description: 'New global title text color (Hex)', example: '#000000' })
    @IsOptional()
    @IsHexColor()
    titleColor?: string;

    @ApiPropertyOptional({
        description: 'New global description text color (Hex)',
        example: '#666666',
    })
    @IsOptional()
    @IsHexColor()
    descriptionColor?: string;
}
