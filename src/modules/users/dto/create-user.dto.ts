import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'johndoe', description: 'The unique username' })
    @IsString()
    username: string;

    @ApiProperty({ example: 'John Doe', description: 'The full name' })
    @IsString()
    fullName: string;

    @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'The password of the user', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: '0123456789', description: 'The phone number', required: false })
    @IsString()
    @IsOptional()
    phone?: string;
}
