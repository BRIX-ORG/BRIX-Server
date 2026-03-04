import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaItemResponseDto {
    @ApiProperty()
    messageId: string;

    @ApiProperty()
    senderId: string;

    @ApiProperty()
    createdAt: Date;

    @ApiPropertyOptional({ type: Object, description: 'Image or file data from MinIO' })
    data: unknown;
}

export class PaginatedMediaResponseDto {
    @ApiProperty({ type: [MediaItemResponseDto] })
    data: MediaItemResponseDto[];

    @ApiProperty() total: number;
    @ApiProperty() limit: number;
    @ApiProperty() offset: number;
}
