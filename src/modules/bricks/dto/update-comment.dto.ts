import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCommentDto {
    @ApiProperty({ description: 'New comment content', example: 'Updated comment text' })
    @IsString()
    @IsNotEmpty()
    content: string;
}
