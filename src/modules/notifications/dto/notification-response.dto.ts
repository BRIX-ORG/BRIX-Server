import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationActorDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    fullName: string;

    @ApiProperty({ required: false, nullable: true })
    avatar?: any;
}

export class NotificationGroupDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: NotificationType })
    type: NotificationType;

    @ApiProperty({ required: false, nullable: true })
    brickId?: string | null;

    @ApiProperty({ required: false, nullable: true })
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
