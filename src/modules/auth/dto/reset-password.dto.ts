import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email address',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        example: 'abc123xyz456',
        description: 'Reset token received after OTP verification',
    })
    @IsString({ message: 'Reset token must be a string' })
    @IsNotEmpty({ message: 'Reset token is required' })
    resetToken: string;

    @ApiProperty({
        example: 'NewSecurePassword123!',
        description: 'New password (minimum 6 characters)',
        minLength: 6,
    })
    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(32, { message: 'Password cannot exceed 32 characters' })
    newPassword: string;
}
