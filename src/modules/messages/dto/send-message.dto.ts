import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({ description: 'Receiver user ID (UUID)' })
    @IsNotEmpty()
    @IsUUID()
    receiverId: string;

    @ApiPropertyOptional({ description: 'Text content of the message' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ description: 'Brick ID to share (UUID)' })
    @IsOptional()
    @IsUUID()
    brickId?: string;
}
