import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Album } from '@prisma/client';
import { AlbumItem } from '@albums/domain';

export class AlbumItemDto {
    @ApiProperty({
        description: 'Detailed image information',
        example: {
            url: 'https://res.cloudinary.com/.../image1.jpg',
            publicId: 'BRIX/albums/abc123',
            width: 1080,
            height: 1920,
        },
    })
    image: {
        url: string;
        publicId: string;
        width?: number;
        height?: number;
    };

    @ApiProperty()
    title: string;

    @ApiProperty()
    description: string;
}

export class AlbumResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional()
    description: string | null;

    @ApiPropertyOptional()
    backgroundColor: string | null;

    @ApiPropertyOptional()
    titleColor: string | null;

    @ApiPropertyOptional()
    descriptionColor: string | null;

    @ApiProperty({ type: [AlbumItemDto] })
    items: AlbumItemDto[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static fromEntity(album: Album): AlbumResponseDto {
        const dto = new AlbumResponseDto();
        dto.id = album.id;
        dto.userId = album.userId;
        dto.name = album.name;
        dto.description = album.description;

        const entity = album as unknown as {
            backgroundColor: string | null;
            titleColor: string | null;
            descriptionColor: string | null;
            items: unknown;
        };

        dto.backgroundColor = entity.backgroundColor;
        dto.titleColor = entity.titleColor;
        dto.descriptionColor = entity.descriptionColor;

        dto.items = (entity.items as AlbumItem[]).map((item) => ({
            image: item.image,
            title: item.title,
            description: item.description,
        }));

        dto.createdAt = album.createdAt;
        dto.updatedAt = album.updatedAt;
        return dto;
    }
}
