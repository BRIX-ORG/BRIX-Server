import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UpvoterAvatarDto {
    @ApiProperty() url: string;
    @ApiProperty() publicId: string;
    @ApiPropertyOptional() width?: number;
    @ApiPropertyOptional() height?: number;
    @ApiPropertyOptional() format?: string;
}

interface UpvoterUser {
    id: string;
    username: string;
    fullName: string;
    avatar: unknown;
}

export class UpvoterResponseDto {
    @ApiProperty() id: string;
    @ApiProperty() username: string;
    @ApiProperty() fullName: string;
    @ApiPropertyOptional({ type: UpvoterAvatarDto }) avatar?: UpvoterAvatarDto | null;

    static fromEntity(user: UpvoterUser): UpvoterResponseDto {
        const dto = new UpvoterResponseDto();
        dto.id = user.id;
        dto.username = user.username;
        dto.fullName = user.fullName;
        dto.avatar = user.avatar as UpvoterAvatarDto | null;
        return dto;
    }
}
