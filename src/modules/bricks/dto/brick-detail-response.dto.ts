import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType, TagType, Brick } from '@prisma/client';

class BrickAuthorDto {
    @ApiProperty() id: string;
    @ApiProperty() username: string;
    @ApiProperty() fullName: string;
    @ApiPropertyOptional({ type: Object }) avatar: unknown;
}

class BrickCountsDto {
    @ApiProperty({ description: 'Total votes (upvote + downvote)' }) votes: number;
    @ApiProperty({ description: 'Total comments' }) comments: number;
}

export class BrickDetailResponseDto {
    @ApiProperty() id: string;
    @ApiProperty({ type: BrickAuthorDto }) user: BrickAuthorDto;
    @ApiPropertyOptional({ type: Object }) media: unknown;
    @ApiPropertyOptional({ type: Object }) thumbnail: unknown;
    @ApiPropertyOptional({ type: Object }) watermark: unknown;
    @ApiProperty() title: string;
    @ApiPropertyOptional() description: string | null;
    @ApiPropertyOptional() generatedDescription: string | null;
    @ApiProperty({ enum: MediaType }) mediaType: MediaType;
    @ApiPropertyOptional({ enum: TagType }) tagType: TagType | null;
    @ApiProperty({ default: true }) isPublic: boolean;
    @ApiPropertyOptional() address: string | null;
    @ApiPropertyOptional({ type: Number }) latitude: number | null;
    @ApiPropertyOptional({ type: Number }) longitude: number | null;
    @ApiProperty({ type: BrickCountsDto }) _count: BrickCountsDto;
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;

    static fromEntity(
        brick: Brick & {
            user: { id: string; username: string; fullName: string; avatar: unknown };
            _count: { votes: number; comments: number };
        },
    ): BrickDetailResponseDto {
        const dto = new BrickDetailResponseDto();
        dto.id = brick.id;
        dto.user = brick.user;
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
        dto._count = brick._count;
        dto.createdAt = brick.createdAt;
        dto.updatedAt = brick.updatedAt;
        return dto;
    }
}
