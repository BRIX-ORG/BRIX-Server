import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Brick, MediaType, TagType } from '@prisma/client';

export class BrickResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiPropertyOptional({ type: Object })
    media: unknown;

    @ApiPropertyOptional({ type: Object })
    thumbnail: unknown;

    @ApiPropertyOptional({ type: Object })
    watermark: unknown;

    @ApiProperty()
    title: string;

    @ApiPropertyOptional()
    description: string | null;

    @ApiPropertyOptional()
    generatedDescription: string | null;

    @ApiProperty({ enum: MediaType })
    mediaType: MediaType;

    @ApiPropertyOptional({ enum: TagType })
    tagType: TagType | null;

    @ApiProperty({ description: 'Whether the brick is public', default: true })
    isPublic: boolean;

    @ApiPropertyOptional()
    address: string | null;

    @ApiPropertyOptional({ type: Number })
    latitude: number | null;

    @ApiPropertyOptional({ type: Number })
    longitude: number | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static fromEntity(brick: Brick): BrickResponseDto {
        const dto = new BrickResponseDto();
        dto.id = brick.id;
        dto.userId = brick.userId;
        dto.media = brick.media;
        dto.thumbnail = brick.thumbnail;
        dto.watermark = brick.watermark;
        dto.title = brick.title;
        dto.description = brick.description;
        dto.generatedDescription = brick.generatedDescription;
        dto.mediaType = brick.mediaType;
        dto.tagType = brick.tagType;
        dto.isPublic = brick.isPublic;
        dto.address = brick.address;
        dto.latitude = brick.latitude ? Number(brick.latitude) : null;
        dto.longitude = brick.longitude ? Number(brick.longitude) : null;
        dto.createdAt = brick.createdAt;
        dto.updatedAt = brick.updatedAt;
        return dto;
    }
}
