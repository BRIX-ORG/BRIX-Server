import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '@users/dto';
import { UserEntity } from '@users/domain';

export class TopAuthorResponseDto extends UserResponseDto {
    @ApiProperty({ description: 'Total number of upvotes across all bricks' })
    totalVotes: number;

    @ApiPropertyOptional()
    isFollowing?: boolean;

    constructor(user: UserEntity, totalVotes: number, isFollowing?: boolean) {
        // UserResponseDto static fromEntity doesn't use constructor, we should just assign
        super();
        Object.assign(this, UserResponseDto.fromEntity(user));
        this.totalVotes = totalVotes;
        if (isFollowing !== undefined) {
            this.isFollowing = isFollowing;
        }
    }
}
