import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
    @ApiProperty({ example: 'John Doe', description: 'The full name of the user', required: false })
    @IsString()
    @IsOptional()
    fullName?: string;

    @ApiProperty({ example: '0123456789', description: 'The phone number', required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
    @IsString()
    @IsOptional()
    avatar?: string;

    @ApiProperty({ example: 'https://example.com/bg.png', required: false })
    @IsString()
    @IsOptional()
    background?: string;

    @ApiProperty({ example: '123 Main St', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ example: 'Hello, I am John', required: false })
    @IsString()
    @IsOptional()
    shortDescription?: string;
}
