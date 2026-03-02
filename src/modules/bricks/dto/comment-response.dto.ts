import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentType } from '@prisma/client';
import { CommentWithDetails } from '../infrastructure/comment.repository';

class CommentAuthorDto {
    @ApiProperty() id: string;
    @ApiProperty() username: string;
    @ApiProperty() fullName: string;
    @ApiPropertyOptional() avatar?: unknown;
}

class CommentImageDto {
    @ApiProperty() url: string;
    @ApiProperty() publicId: string;
    @ApiPropertyOptional() width?: number;
    @ApiPropertyOptional() height?: number;
    @ApiPropertyOptional() format?: string;
}

// Type for a reply (comment without nested replies)
type ReplyWithDetails = CommentWithDetails['replies'][number];

export class CommentResponseDto {
    @ApiProperty() id: string;
    @ApiProperty() brickId: string;
    @ApiProperty() content: string;
    @ApiProperty({ enum: CommentType }) type: CommentType;
    @ApiPropertyOptional() parentId?: string | null;
    @ApiProperty({ type: () => CommentAuthorDto }) user: CommentAuthorDto;
    @ApiProperty() likeCount: number;
    @ApiProperty() replyCount: number;
    @ApiProperty({ type: [CommentImageDto] }) images: CommentImageDto[];
    @ApiPropertyOptional({ type: [CommentResponseDto] }) replies?: CommentResponseDto[];
    @ApiProperty() createdAt: Date;
    @ApiProperty() updatedAt: Date;

    static fromEntity(comment: CommentWithDetails, includeReplies?: true): CommentResponseDto;
    static fromEntity(comment: ReplyWithDetails, includeReplies: false): CommentResponseDto;
    static fromEntity(
        comment: CommentWithDetails | ReplyWithDetails,
        includeReplies = true,
    ): CommentResponseDto {
        const dto = new CommentResponseDto();
        dto.id = comment.id;
        dto.brickId = comment.brickId;
        dto.content = comment.content;
        dto.type = comment.type;
        dto.parentId = comment.parentId;
        dto.user = comment.user as CommentAuthorDto;
        dto.likeCount = comment._count?.votes ?? 0;
        dto.replyCount = (comment._count as { votes: number; replies?: number }).replies ?? 0;
        dto.images = (comment.images as CommentImageDto[] | null) ?? [];
        dto.createdAt = comment.createdAt;
        dto.updatedAt = comment.updatedAt;

        if (includeReplies && 'replies' in comment && comment.replies) {
            dto.replies = comment.replies.map((r) => CommentResponseDto.fromEntity(r, false));
        }

        return dto;
    }
}
