import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdatePasswordDto {
    @ApiProperty({
        example: 'OldPassword123!',
        description: 'Current password',
    })
    @IsString({ message: 'Current password must be a string' })
    @IsNotEmpty({ message: 'Current password is required' })
    currentPassword: string;

    @ApiProperty({
        example: 'NewPassword123!',
        description: 'New password',
        minLength: 6,
    })
    @IsString({ message: 'New password must be a string' })
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(6, { message: 'New password must be at least 6 characters long' })
    @MaxLength(32, { message: 'New password cannot exceed 32 characters' })
    newPassword: string;
}
