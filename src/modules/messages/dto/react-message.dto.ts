import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReactMessageDto {
    @ApiProperty({ description: 'Emoji reaction to toggle', example: '👍' })
    @IsNotEmpty()
    @IsString()
    emoji: string;
}
