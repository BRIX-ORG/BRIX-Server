import { ApiProperty } from '@nestjs/swagger';

export class PhotoSessionResponseDto {
    @ApiProperty({
        description: 'Unique session ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    sessionId: string;

    @ApiProperty({ description: 'One-time nonce to display on screen', example: 'A91DFK' })
    nonce: string;

    @ApiProperty({ description: 'Session expiry in seconds', example: 30 })
    expiresIn: number;
}
