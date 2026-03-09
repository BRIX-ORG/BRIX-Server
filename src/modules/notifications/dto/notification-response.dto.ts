import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationActorDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    fullName: string;

    @ApiPropertyOptional({ type: Object, nullable: true })
    avatar?: any;

    @ApiProperty({
        example: 'MALE',
        description: 'The gender of the user',
        enum: ['MALE', 'FEMALE', 'OTHER'],
    })
    gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export class NotificationBrickDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiPropertyOptional({ type: Object, nullable: true })
    watermark?: any;

    @ApiPropertyOptional({ enum: ['IMAGE', 'GLTF', 'VIDEO'] })
    mediaType?: string;
}

export class NotificationCommentDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    content: string;

    @ApiPropertyOptional({ enum: ['COMMENT', 'REPLY'] })
    type?: string;
}

export class NotificationGroupDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: NotificationType })
    type: NotificationType;

    @ApiPropertyOptional({ nullable: true })
    brickId?: string | null;

    @ApiPropertyOptional({ nullable: true })
    commentId?: string | null;

    @ApiProperty()
    actorsCount: number;

    @ApiProperty()
    isRead: boolean;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: NotificationActorDto })
    lastActor: NotificationActorDto;

    @ApiProperty({
        type: [NotificationActorDto],
        description: 'List of some actors who triggered this',
    })
    actors: { actor: NotificationActorDto }[];

    @ApiPropertyOptional({
        type: NotificationBrickDto,
        nullable: true,
        description: 'The brick related to this notification (if any)',
    })
    brick?: NotificationBrickDto | null;

    @ApiPropertyOptional({
        type: NotificationCommentDto,
        nullable: true,
        description: 'The comment related to this notification (if any)',
    })
    comment?: NotificationCommentDto | null;
}

export class PaginatedNotificationsDto {
    @ApiProperty({ type: [NotificationGroupDto] })
    data: NotificationGroupDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    offset: number;
}

export class UnreadCountDto {
    @ApiProperty({ description: 'Number of unread notifications' })
    count: number;
}
