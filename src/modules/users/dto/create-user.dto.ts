import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    IsOptional,
    MinLength,
    IsNotEmpty,
    Matches,
    MaxLength,
    IsEnum,
} from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'johndoe', description: 'The unique username' })
    @IsString({ message: 'Username must be a string' })
    @IsNotEmpty({ message: 'Username is required' })
    @MinLength(3, { message: 'Username must be at least 3 characters long' })
    @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
    @Matches(/^(?!.*\.\.)(?!.*\.$)(?!^\.)[a-zA-Z0-9._]{3,30}$/, {
        message:
            'Username can only contain letters, numbers, dots, and underscores. Dots cannot be at the start or end, or be consecutive.',
    })
    username: string;

    @ApiProperty({ example: 'John Doe', description: 'The full name' })
    @IsString({ message: 'Full name must be a string' })
    @IsNotEmpty({ message: 'Full name is required' })
    @MaxLength(50, { message: 'Full name cannot exceed 50 characters' })
    fullName: string;

    @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please enter a valid email address' })
    @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
    email: string;

    @ApiProperty({
        example: 'password123',
        description: 'The password of the user',
        minLength: 6,
    })
    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(32, { message: 'Password cannot exceed 32 characters' })
    password: string;

    @ApiProperty({
        example: '0912345678',
        description: 'The phone number (Vietnam format)',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Phone must be a string' })
    @Matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, {
        message: 'Please enter a valid Vietnam phone number (e.g., 0912345678)',
    })
    @MaxLength(15, { message: 'Phone number cannot exceed 15 characters' })
    phone?: string;

    @ApiProperty({
        example: 'MALE',
        description: 'Gender of the user',
        enum: ['MALE', 'FEMALE', 'OTHER'],
    })
    @IsEnum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender must be MALE, FEMALE, or OTHER' })
    @IsNotEmpty({ message: 'Gender is required' })
    gender: 'MALE' | 'FEMALE' | 'OTHER';
}
