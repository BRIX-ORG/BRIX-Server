import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common';
import { UserEntity } from '@users/domain';
import { FollowService, GetFollowersService, GetFollowingService } from '@follows/application';
import {
    FollowStatusResponseDto,
    PaginatedFollowersResponseDto,
    PaginationQueryDto,
} from '@follows/dto';

@ApiTags('Follows')
@Controller('follows')
export class FollowsController {
    constructor(
        private readonly followService: FollowService,
        private readonly getFollowersService: GetFollowersService,
        private readonly getFollowingService: GetFollowingService,
    ) {}

    @Post(':userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Follow a user' })
    @ApiParam({ name: 'userId', description: 'ID of the user to follow' })
    @ApiResponse({
        status: 200,
        description: 'Successfully followed user',
        type: FollowStatusResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Cannot follow yourself' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 409, description: 'Already following this user' })
    async follow(
        @CurrentUser() user: UserEntity,
        @Param('userId') userId: string,
    ): Promise<FollowStatusResponseDto> {
        return this.followService.follow(user.id, userId);
    }

    @Delete(':userId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Unfollow a user' })
    @ApiParam({ name: 'userId', description: 'ID of the user to unfollow' })
    @ApiResponse({
        status: 200,
        description: 'Successfully unfollowed user',
        type: FollowStatusResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Cannot unfollow yourself' })
    @ApiResponse({ status: 404, description: 'Not following this user' })
    async unfollow(
        @CurrentUser() user: UserEntity,
        @Param('userId') userId: string,
    ): Promise<FollowStatusResponseDto> {
        return this.followService.unfollow(user.id, userId);
    }

    @Get('users/:idOrUsername/followers')
    @ApiOperation({ summary: 'Get followers of a user' })
    @ApiParam({ name: 'idOrUsername', description: 'User ID or username' })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Number of items per page. If not provided, returns all.',
    })
    @ApiQuery({ name: 'offset', required: false, description: 'Number of items to skip' })
    @ApiResponse({
        status: 200,
        description: 'Followers list',
        type: PaginatedFollowersResponseDto,
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getFollowers(
        @Param('idOrUsername') idOrUsername: string,
        @Query() query: PaginationQueryDto,
        @CurrentUser() user?: UserEntity,
    ): Promise<PaginatedFollowersResponseDto> {
        return this.getFollowersService.execute(idOrUsername, query, user?.id);
    }

    @Get('users/:idOrUsername/following')
    @ApiOperation({ summary: 'Get users that a user is following' })
    @ApiParam({ name: 'idOrUsername', description: 'User ID or username' })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Number of items per page. If not provided, returns all.',
    })
    @ApiQuery({ name: 'offset', required: false, description: 'Number of items to skip' })
    @ApiResponse({
        status: 200,
        description: 'Following list',
        type: PaginatedFollowersResponseDto,
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getFollowing(
        @Param('idOrUsername') idOrUsername: string,
        @Query() query: PaginationQueryDto,
        @CurrentUser() user?: UserEntity,
    ): Promise<PaginatedFollowersResponseDto> {
        return this.getFollowingService.execute(idOrUsername, query, user?.id);
    }
}
