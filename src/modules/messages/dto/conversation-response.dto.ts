import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { MessageResponseDto } from './message-response.dto';

export class ConversationPartnerDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    fullName: string;

    @ApiPropertyOptional({ type: Object, nullable: true })
    avatar: unknown;

    @ApiProperty({ enum: Gender })
    gender: Gender;

    @ApiProperty()
    isOnline: boolean;

    @ApiPropertyOptional({ nullable: true })
    lastSeenAt: Date | null;
}

export class ConversationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: ConversationPartnerDto })
    partner: ConversationPartnerDto;

    @ApiPropertyOptional({ type: MessageResponseDto, nullable: true })
    lastMessage: MessageResponseDto | null;

    @ApiProperty({ description: 'Number of unread messages in this conversation' })
    unreadCount: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
