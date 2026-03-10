import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import { Brick } from '@prisma/client';
import {
    GetNewsfeedBricksService,
    GetBrickLocationsService,
    GetFollowingBricksService,
} from '@bricks/application';
import {
    GetNewsfeedBricksDto,
    GetBrickLocationsDto,
    GetFollowingBricksDto,
    BrickResponseDto,
    BrickLocationResponseDto,
    PaginatedBricksResponseDto,
} from '@bricks/dto';

@ApiTags('Bricks Newsfeed')
@Controller('bricks/newsfeed')
export class BrickNewsfeedController {
    constructor(
        private readonly getNewsfeedBricksService: GetNewsfeedBricksService,
        private readonly getBrickLocationsService: GetBrickLocationsService,
        private readonly getFollowingBricksService: GetFollowingBricksService,
    ) {}

    @Get()
    @ApiOperation({
        summary: 'Get newsfeed bricks sorted by popularity',
        description: 'Returns a paginated list of bricks sorted by vote count within a time range.',
    })
    @ApiResponse({
        status: 200,
        description: 'Paginated list of hot bricks.',
        type: PaginatedBricksResponseDto,
    })
    async getNewsfeedBricks(
        @Query() query: GetNewsfeedBricksDto,
    ): Promise<PaginatedBricksResponseDto> {
        const { data, total, limit, offset } = await this.getNewsfeedBricksService.execute(query);

        return {
            data: data.map((b) => BrickResponseDto.fromEntity(b)),
            total,
            limit,
            offset,
        };
    }

    @Get('locations')
    @ApiOperation({
        summary: 'Get all brick locations for map',
        description: 'Returns lightweight brick data (id, lat, long, type) for map markers.',
    })
    @ApiResponse({
        status: 200,
        description: 'List of brick locations.',
        type: [BrickLocationResponseDto],
    })
    async getBrickLocations(
        @Query() query: GetBrickLocationsDto,
    ): Promise<BrickLocationResponseDto[]> {
        const bricks = await this.getBrickLocationsService.execute(query);
        return bricks.map((b) => BrickLocationResponseDto.fromEntity(b as Brick));
    }

    @Get('locations/me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get current user brick locations for map',
        description: 'Returns map markers only for bricks owned by the current user.',
    })
    @ApiResponse({
        status: 200,
        description: 'List of user brick locations.',
        type: [BrickLocationResponseDto],
    })
    async getMyBrickLocations(
        @CurrentUser() user: UserEntity,
        @Query() query: GetBrickLocationsDto,
    ): Promise<BrickLocationResponseDto[]> {
        const bricks = await this.getBrickLocationsService.execute(query, user.id);
        return bricks.map((b) => BrickLocationResponseDto.fromEntity(b as Brick));
    } // Added closing brace for getMyBrickLocations

    @Get('following')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get newsfeed bricks from followed users',
        description:
            'Returns a paginated list of bricks created by users the current user follows, sorted newest first.',
    })
    @ApiResponse({
        status: 200,
        description: 'Paginated list of following bricks.',
        type: PaginatedBricksResponseDto,
    })
    async getFollowingBricks(
        @CurrentUser() user: UserEntity,
        @Query() query: GetFollowingBricksDto,
    ): Promise<PaginatedBricksResponseDto> {
        const { data, total, limit, offset } = await this.getFollowingBricksService.execute(
            user.id,
            query,
        );

        return {
            data: data.map((b) => BrickResponseDto.fromEntity(b)),
            total,
            limit,
            offset,
        };
    }
}
