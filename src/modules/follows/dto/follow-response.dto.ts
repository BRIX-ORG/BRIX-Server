import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, Provider, Role } from '@prisma/client';

export class FollowerResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    fullName: string;

    @ApiPropertyOptional({ type: Object })
    avatar: unknown;

    @ApiProperty({ enum: Gender })
    gender: Gender;

    @ApiProperty({ enum: Role })
    role: Role;

    @ApiProperty({ enum: Provider })
    provider: Provider;

    @ApiPropertyOptional()
    shortDescription: string | null;

    @ApiPropertyOptional()
    isFollowing?: boolean;
}

export class PaginatedFollowersResponseDto {
    @ApiProperty({ type: [FollowerResponseDto] })
    data: FollowerResponseDto[];

    @ApiProperty()
    total: number;

    @ApiPropertyOptional()
    limit: number | null;

    @ApiProperty()
    offset: number;
}

export class FollowStatusResponseDto {
    @ApiProperty()
    isFollowing: boolean;
}
