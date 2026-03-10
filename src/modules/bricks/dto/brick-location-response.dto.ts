import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TagType, Brick } from '@prisma/client';

export class BrickLocationResponseDto {
    @ApiProperty({ description: 'The unique identifier of the brick', format: 'uuid' })
    id: string;

    @ApiPropertyOptional({ description: 'Latitude coordinate of the brick' })
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude coordinate of the brick' })
    longitude?: number;

    @ApiProperty({ enum: TagType, description: 'Type of the brick (e.g., ART, REALTIME)' })
    tagType: TagType;

    static fromEntity(brick: Brick): BrickLocationResponseDto {
        const dto = new BrickLocationResponseDto();
        dto.id = brick.id;
        dto.latitude = brick.latitude !== null ? Number(brick.latitude) : undefined;
        dto.longitude = brick.longitude !== null ? Number(brick.longitude) : undefined;
        dto.tagType = brick.tagType || TagType.ART; // Default fallback to satisfy TS
        return dto;
    }
}
