import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token from cookies or manual input',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
