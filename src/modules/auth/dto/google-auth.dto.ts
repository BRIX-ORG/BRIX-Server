import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
    @ApiProperty({
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5Zjc2...',
        description: 'Firebase ID Token from client',
    })
    @IsNotEmpty({ message: 'ID token is required' })
    @IsString({ message: 'ID token must be a string' })
    idToken: string;
}
