import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email address to verify',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
}
