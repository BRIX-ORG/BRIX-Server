import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsHexColor } from 'class-validator';

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

    @ApiPropertyOptional({ description: 'New global background color (Hex)', example: '#ffffff' })
    @IsOptional()
    @IsHexColor()
    backgroundColor?: string;

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
