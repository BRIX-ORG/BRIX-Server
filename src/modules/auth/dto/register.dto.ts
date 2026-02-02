import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    IsOptional,
    Matches,
    MaxLength,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        example: 'johndoe',
        description: 'Unique username',
    })
    @IsString({ message: 'Username must be a string' })
    @IsNotEmpty({ message: 'Username is required' })
    @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
    @Matches(/^(?!.*\.\.)(?!.*\.$)(?!^\.)[a-zA-Z0-9._]{3,30}$/, {
        message:
            'Username can only contain letters, numbers, dots, and underscores. Dots cannot be at the start or end, or be consecutive.',
    })
    username: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'Full name of the user',
    })
    @IsString({ message: 'Full name must be a string' })
    @IsNotEmpty({ message: 'Full name is required' })
    @MaxLength(50, { message: 'Full name cannot exceed 50 characters' })
    fullName: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'User email address',
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please enter a valid email address' })
    @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
    email: string;

    @ApiPropertyOptional({
        example: '0912345678',
        description: 'Phone number (Vietnam format)',
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

    @ApiProperty({
        example: 'SecurePassword123!',
        description: 'User password',
        minLength: 6,
    })
    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(32, { message: 'Password cannot exceed 32 characters' })
    password: string;
}
