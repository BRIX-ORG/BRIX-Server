import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
    @ApiProperty({ example: 'John', description: 'The first name of the user', required: false })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({ example: 'Doe', description: 'The last name of the user', required: false })
    @IsString()
    @IsOptional()
    lastName?: string;
}
