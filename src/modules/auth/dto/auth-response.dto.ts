import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@users/dto';

export class AuthResponseDto {
    @ApiProperty({
        description: 'User information metadata',
        type: UserResponseDto,
    })
    user: UserResponseDto;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    accessToken: string;

    @ApiProperty({
        example: 1704067200000,
        description: 'Access token expiration Unix timestamp (ms)',
    })
    accessTokenExpiresAt: number;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    refreshToken: string;

    @ApiProperty({
        example: 1704672000000,
        description: 'Refresh token expiration Unix timestamp (ms)',
    })
    refreshTokenExpiresAt: number;
}
