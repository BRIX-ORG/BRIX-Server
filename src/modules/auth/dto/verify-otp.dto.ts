import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email address',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({
        example: '123456',
        description: '6-digit OTP code',
    })
    @IsString({ message: 'OTP must be a string' })
    @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
    otp: string;
}
