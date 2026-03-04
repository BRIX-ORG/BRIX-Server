import { ApiProperty } from '@nestjs/swagger';

export class PhotoSessionResponseDto {
    @ApiProperty({
        description: 'Unique session ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    sessionId: string;

    @ApiProperty({
        description: 'Base64-encoded HMAC-signed token. Render as QR code on canvas.',
        example: 'eyJub25jZSI6IkE5MURGSyIsInRzIjoxNzA5NTM4MDAwMDAwLCJzaWciOiIuLi4ifQ==',
    })
    qrToken: string;

    @ApiProperty({ description: 'Session expiry in seconds', example: 90 })
    expiresIn: number;
}
