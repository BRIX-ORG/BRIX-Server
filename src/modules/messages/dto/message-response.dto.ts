import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Message } from '@prisma/client';
import {
    MessageFileData,
    MessageImageData,
    MessageVoiceData,
    MessageReactions,
} from '@messages/domain';

export class MessageResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    conversationId: string;

    @ApiProperty()
    senderId: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    content: string | null;

    @ApiPropertyOptional({
        type: 'array',
        items: {
            type: 'object',
            properties: {
                url: { type: 'string' },
                objectName: { type: 'string' },
                etag: { type: 'string' },
                width: { type: 'number' },
                height: { type: 'number' },
            },
        },
        nullable: true,
        description: 'Array of 1-3 images stored in MinIO',
    })
    images: MessageImageData[] | null;

    @ApiPropertyOptional({
        type: 'object',
        properties: {
            url: { type: 'string' },
            objectName: { type: 'string' },
            etag: { type: 'string' },
            duration: { type: 'number' },
            mimeType: { type: 'string' },
        },
        nullable: true,
        description: 'Voice message stored in MinIO',
    })
    voice: MessageVoiceData | null;

    @ApiPropertyOptional({
        type: 'object',
        properties: {
            url: { type: 'string' },
            objectName: { type: 'string' },
            etag: { type: 'string' },
            fileName: { type: 'string' },
            fileSize: { type: 'number' },
            mimeType: { type: 'string' },
        },
        nullable: true,
        description: 'File attachment stored in MinIO',
    })
    file: MessageFileData | null;

    @ApiPropertyOptional({ nullable: true, description: 'Shared brick ID' })
    brickId: string | null;

    @ApiPropertyOptional({
        type: 'object',
        additionalProperties: {
            type: 'array',
            items: { type: 'string' },
        },
        nullable: true,
        description: 'Reactions map: { emoji: [userId1, userId2, ...] }',
        example: { '👍': ['uuid1'], '❤️': ['uuid2', 'uuid3'] },
    })
    reactions: MessageReactions | null;

    @ApiProperty()
    isRead: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static fromEntity(message: Message): MessageResponseDto {
        const dto = new MessageResponseDto();
        dto.id = message.id;
        dto.conversationId = message.conversationId;
        dto.senderId = message.senderId;
        dto.content = message.content;
        dto.images = message.images as MessageImageData[] | null;
        dto.voice = message.voice as MessageVoiceData | null;
        dto.file = message.file as MessageFileData | null;
        dto.brickId = message.brickId;
        dto.reactions = message.reactions as MessageReactions | null;
        dto.isRead = message.isRead;
        dto.createdAt = message.createdAt;
        dto.updatedAt = message.updatedAt;
        return dto;
    }
}
