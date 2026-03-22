import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Brick, MediaType, TagType, User } from '@prisma/client';

export class BrickMetadataDto {
    @ApiProperty()
    id: string;

    @ApiPropertyOptional({ type: Object })
    rawExif: unknown;

    @ApiPropertyOptional({ type: Object })
    modelData: unknown;

    @ApiPropertyOptional()
    hashSha256: string | null;

    @ApiPropertyOptional()
    ipfsCid: string | null;

    @ApiPropertyOptional()
    imageCid: string | null;

    @ApiPropertyOptional()
    onChainTx: string | null;

    @ApiPropertyOptional()
    contractAddr: string | null;

    @ApiPropertyOptional()
    onChainStatus: string | null;

    @ApiPropertyOptional()
    verifiedAt: Date | null;
}

export class BrickAuthorDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    fullName: string;

    @ApiPropertyOptional({ type: Object })
    avatar: unknown;

    @ApiProperty()
    gender: string;
}

export class BrickResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiPropertyOptional({ type: BrickAuthorDto })
    user?: BrickAuthorDto | null;

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

    @ApiPropertyOptional({ type: BrickMetadataDto })
    metadata?: BrickMetadataDto | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static fromEntity(
        brick: Brick & {
            metadata?: any;
            user?: Pick<User, 'id' | 'username' | 'fullName' | 'avatar' | 'gender'> | null;
        },
    ): BrickResponseDto {
        const dto = new BrickResponseDto();
        dto.id = brick.id;
        dto.userId = brick.userId;
        dto.user = brick.user
            ? {
                  id: brick.user.id,
                  username: brick.user.username,
                  fullName: brick.user.fullName,
                  avatar: brick.user.avatar,
                  gender: brick.user.gender,
              }
            : undefined;
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
        dto.metadata = brick.metadata as BrickMetadataDto;
        dto.createdAt = brick.createdAt;
        dto.updatedAt = brick.updatedAt;
        return dto;
    }
}
