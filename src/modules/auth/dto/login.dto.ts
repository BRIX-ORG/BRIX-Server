import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        example: 'user@example.com or johndoe',
        description: 'Username or email address',
    })
    @IsString({ message: 'Identifier must be a string' })
    @IsNotEmpty({ message: 'Username or email is required' })
    @MaxLength(100, { message: 'Identifier cannot exceed 100 characters' })
    identifier: string;

    @ApiProperty({
        example: 'Password123!',
        description: 'User password',
        minLength: 6,
    })
    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(32, { message: 'Password cannot exceed 32 characters' })
    password: string;
}
