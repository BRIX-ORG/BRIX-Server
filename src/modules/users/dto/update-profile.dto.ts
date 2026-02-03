import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, Matches, IsEnum } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
    @ApiProperty({ example: 'John Doe', description: 'The full name of the user', required: false })
    @IsString({ message: 'Full name must be a string' })
    @IsOptional()
    @MaxLength(50, { message: 'Full name cannot exceed 50 characters' })
    fullName?: string;

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
        description: 'The gender of the user',
        enum: Gender,
        required: false,
    })
    @IsOptional()
    @IsEnum(Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' })
    gender?: Gender;

    @ApiProperty({ example: '123 Main St', required: false })
    @IsOptional()
    @IsString({ message: 'Address must be a string' })
    @MaxLength(100, { message: 'Address cannot exceed 100 characters' })
    address?: string;

    @ApiProperty({ example: 'Hello, I am John', required: false })
    @IsOptional()
    @IsString({ message: 'Short description must be a string' })
    @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
    shortDescription?: string;
}
