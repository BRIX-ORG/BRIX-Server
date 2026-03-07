import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsArray,
    MaxLength,
    ArrayMaxSize,
    ValidateNested,
    IsHexColor,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';

export class CreateAlbumItemMetadataDto {
    @ApiProperty({ description: 'Title of the album page' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiPropertyOptional({ description: 'Description of the album page' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateAlbumDto {
    @ApiProperty({ description: 'Name of the album', example: 'Summer Trip 2024' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ description: 'Short description of the album' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiPropertyOptional({
        description: 'Global background color for the album (Hex)',
        example: '#ffffff',
    })
    @IsOptional()
    @IsHexColor()
    backgroundColor?: string;

    @ApiPropertyOptional({
        description: 'Global title text color for the album (Hex)',
        example: '#000000',
    })
    @IsOptional()
    @IsHexColor()
    titleColor?: string;

    @ApiPropertyOptional({
        description: 'Global description text color for the album (Hex)',
        example: '#666666',
    })
    @IsOptional()
    @IsHexColor()
    descriptionColor?: string;

    @ApiProperty({
        description:
            'Metadata for each page (titles and descriptions). Note: The index must match the images array.',
        type: [CreateAlbumItemMetadataDto],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(10)
    @ValidateNested({ each: true })
    @Type(() => CreateAlbumItemMetadataDto)
    @Transform(({ value }: { value: unknown }): CreateAlbumItemMetadataDto[] => {
        let items = value;
        if (typeof value === 'string') {
            try {
                items = JSON.parse(value);
            } catch {
                return [];
            }
        }

        if (!Array.isArray(items)) {
            return [];
        }

        return items.map((item) => plainToInstance(CreateAlbumItemMetadataDto, item));
    })
    items: CreateAlbumItemMetadataDto[];
}
