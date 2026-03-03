import { ApiProperty } from '@nestjs/swagger';
import { CommentResponseDto } from './comment-response.dto';

export class PaginatedCommentsResponseDto {
    @ApiProperty({ type: [CommentResponseDto] })
    comments: CommentResponseDto[];

    @ApiProperty()
    total: number;
}
