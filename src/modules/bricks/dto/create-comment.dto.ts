import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
    @ApiProperty({ description: 'Comment content', example: 'Great brick!' })
    @IsString()
    content: string;

    @ApiPropertyOptional({
        description: 'Parent comment ID — makes this a reply',
        example: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    parentId?: string;
}
