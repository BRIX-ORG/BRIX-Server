import {
    Controller,
    Post,
    Get,
    Delete,
    Put,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    BadRequestException,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiExtraModels,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/response.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import {
    UploadArtService,
    UploadGlbService,
    GetBricksService,
    UpdateBrickService,
    DeleteBrickThumbnailService,
    AddBrickThumbnailsService,
    DeleteBrickService,
    GetBrickDetailService,
    GetTopAuthorsPaginatedService,
    GetUserRealtimeBricksService,
    GetUserBrickStatsService,
} from '@bricks/application';
import { GetDonationsService } from '@onchain/application';
import { DonationResponseDto } from '@onchain/dto/donation-response.dto';
import {
    CreateBrickDto,
    BrickResponseDto,
    BrickDetailResponseDto,
    BricksQueryDto,
    PaginatedBricksResponseDto,
    UpdateBrickDto,
    CommentResponseDto,
    VoteResponseDto,
    PaginatedCommentsResponseDto,
    UpvoterResponseDto,
    PaginatedTopAuthorsResponseDto,
    TopAuthorResponseDto,
    GetRealtimeBricksQueryDto,
    PaginatedRealtimeBricksResponseDto,
    RealtimeBrickResponseDto,
    UserBrickStatsResponseDto,
} from '@bricks/dto';
import { PaginationQueryDto } from '@follows/dto';

@ApiTags('Bricks')
@Controller('bricks')
@ApiExtraModels(
    ApiResponseDto,
    BrickResponseDto,
    CommentResponseDto,
    VoteResponseDto,
    PaginatedCommentsResponseDto,
    UpvoterResponseDto,
    PaginatedTopAuthorsResponseDto,
    UserBrickStatsResponseDto,
)
export class BricksController {
    constructor(
        private readonly uploadArtService: UploadArtService,
        private readonly uploadGlbService: UploadGlbService,
        private readonly getBricksService: GetBricksService,
        private readonly updateBrickService: UpdateBrickService,
        private readonly deleteBrickThumbnailService: DeleteBrickThumbnailService,
        private readonly addBrickThumbnailsService: AddBrickThumbnailsService,
        private readonly deleteBrickService: DeleteBrickService,
        private readonly getBrickDetailService: GetBrickDetailService,
        private readonly getTopAuthorsPaginatedService: GetTopAuthorsPaginatedService,
        private readonly getDonationsService: GetDonationsService,
        private readonly getUserRealtimeBricksService: GetUserRealtimeBricksService,
        private readonly getUserBrickStatsService: GetUserBrickStatsService,
    ) {}

    // ─── Top Authors ─────────────────────────────────────────────────────────

    @Get('top-authors')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get top authors by brick upvotes (Paginated)' })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Number of items per page. If not provided, returns 10.',
    })
    @ApiQuery({ name: 'offset', required: false, description: 'Number of items to skip' })
    @ApiResponse({
        status: 200,
        description: 'Top authors list',
        type: PaginatedTopAuthorsResponseDto,
    })
    async getTopAuthors(
        @Query() query: PaginationQueryDto,
        @CurrentUser() user?: UserEntity,
    ): Promise<PaginatedTopAuthorsResponseDto> {
        const result = await this.getTopAuthorsPaginatedService.execute(query, user?.id);
        return {
            ...result,
            data: result.data.map(
                (r) => new TopAuthorResponseDto(r.user, r.totalVotes, r.isFollowing),
            ),
        };
    }

    // ─── Upload Art ──────────────────────────────────────────────────────────

    @Post('upload/art')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Upload an art brick (image with watermark)' })
    @ApiBody({
        description: 'Art image file with metadata',
        schema: {
            type: 'object',
            required: ['file', 'title'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (jpg, png, webp, etc.)',
                },
                title: { type: 'string' },
                description: { type: 'string' },
                address: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description:
            'Art Brick created successfully. ' +
            'media contains the original image (MinIO), ' +
            'watermark contains the watermarked version (Cloudinary).',
        type: BrickResponseDto,
    })
    @ApiResponse({ status: 400, description: 'No file uploaded or invalid file type.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async uploadArt(
        @CurrentUser() user: UserEntity,
        @UploadedFile() file: Express.Multer.File,
        @Body() createBrickDto: CreateBrickDto,
    ): Promise<BrickResponseDto> {
        if (!file) throw new BadRequestException('No file uploaded');

        const brick = await this.uploadArtService.execute(user.id, file, createBrickDto.title, {
            description: createBrickDto.description,
            address: createBrickDto.address,
            latitude: createBrickDto.latitude,
            longitude: createBrickDto.longitude,
        });

        return BrickResponseDto.fromEntity(brick);
    }

    // ─── Upload GLB ──────────────────────────────────────────────────────────

    @Post('upload/glb')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'glb', maxCount: 1 },
                { name: 'thumbnails', maxCount: 5 },
            ],
            { limits: { fileSize: 15 * 1024 * 1024 } }, // 15MB for GLB files
        ),
    )
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Upload a GLB 3D model brick with thumbnails (1-5 images)' })
    @ApiBody({
        description: 'GLB file with thumbnail images and metadata',
        schema: {
            type: 'object',
            required: ['glb', 'thumbnails', 'title'],
            properties: {
                glb: { type: 'string', format: 'binary', description: 'GLB 3D model file (.glb)' },
                thumbnails: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Thumbnail images (1-5, jpg/png/webp)',
                },
                title: { type: 'string' },
                description: { type: 'string' },
                address: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description:
            'GLB Brick created successfully. ' +
            'media contains the GLB file (Cloudinary), ' +
            'thumbnail is an array of 1-5 thumbnails (Cloudinary), ' +
            'watermark is the first thumbnail (used for description generation).',
        type: BrickResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Missing files or invalid file type.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async uploadGlb(
        @CurrentUser() user: UserEntity,
        @UploadedFiles()
        files: { glb?: Express.Multer.File[]; thumbnails?: Express.Multer.File[] },
        @Body() createBrickDto: CreateBrickDto,
    ): Promise<BrickResponseDto> {
        const glbFile = files.glb?.[0];
        const thumbnailFiles = files.thumbnails;

        if (!glbFile) throw new BadRequestException('No GLB file uploaded');
        if (!thumbnailFiles || thumbnailFiles.length === 0)
            throw new BadRequestException('At least one thumbnail image is required');

        const brick = await this.uploadGlbService.execute(
            user.id,
            glbFile,
            thumbnailFiles,
            createBrickDto.title,
            {
                description: createBrickDto.description,
                address: createBrickDto.address,
                latitude: createBrickDto.latitude,
                longitude: createBrickDto.longitude,
            },
        );

        return BrickResponseDto.fromEntity(brick);
    }

    // ─── Get Brick Detail ────────────────────────────────────────────────────

    @Get(':id')
    @ApiOperation({
        summary: 'Get brick detail by ID',
        description:
            'Returns basic brick info with author and vote/comment counts. ' +
            'Use separate APIs (votes, comments, upvoters) for more detail.',
    })
    @ApiResponse({ status: 200, description: 'Brick detail.', type: BrickDetailResponseDto })
    @ApiResponse({ status: 404, description: 'Brick not found.' })
    async getBrickDetail(@Param('id', ParseUUIDPipe) id: string): Promise<BrickDetailResponseDto> {
        const brick = await this.getBrickDetailService.execute(id);
        return BrickDetailResponseDto.fromEntity(brick);
    }

    // ─── Get Donations ───────────────────────────────────────────────────────

    @Get(':id/donations')
    @ApiOperation({
        summary: 'Get all donations for a specific brick',
    })
    @ApiResponse({
        status: 200,
        description: 'List of donations.',
        type: [DonationResponseDto],
    })
    async getDonations(@Param('id', ParseUUIDPipe) id: string): Promise<DonationResponseDto[]> {
        const donations = await this.getDonationsService.execute(id);
        return donations.map((d) => ({
            id: d.id,
            brickId: d.brickId,
            fromAddress: d.fromAddress,
            amount: d.amount.toString(),
            txHash: d.txHash,
            createdAt: d.createdAt,
        }));
    }

    // ─── List User Bricks ─────────────────────────────────────────────────────

    @Get('user/:idOrUsername')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get bricks of a user by ID or username with optional filter by type',
        description:
            'If the requester is the owner (valid JWT matching the resolved user), all bricks are returned. ' +
            'Otherwise only public bricks are returned.',
    })
    @ApiParam({
        name: 'idOrUsername',
        description: 'User ID (UUID) or unique username',
        example: 'johndoe',
    })
    @ApiQuery({
        name: 'tagType',
        required: false,
        enum: ['REALTIME', 'ART', 'PRODUCT'],
        description: 'Filter by tag type',
    })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    @ApiResponse({
        status: 200,
        description: 'Paginated list of bricks.',
        type: PaginatedBricksResponseDto,
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async getUserBricks(
        @CurrentUser() user: UserEntity | undefined,
        @Param('idOrUsername') idOrUsername: string,
        @Query() query: BricksQueryDto,
    ): Promise<PaginatedBricksResponseDto> {
        const { data, total, limit, offset } = await this.getBricksService.execute(
            idOrUsername,
            user?.id,
            query.tagType,
            query.limit,
            query.offset,
        );

        return {
            data: data.map((b) => BrickResponseDto.fromEntity(b)),
            total,
            limit: limit ?? 20,
            offset: offset ?? 0,
        };
    }

    // ─── List User Realtime Bricks (Management) ───────────────────────────────

    @Get('user/:idOrUsername/realtime')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get realtime bricks of a user by ID or username with revenue',
        description:
            'Returns ONLY REALTIME bricks with calculated donations revenue. Can optionally filter by onChainStatus.',
    })
    @ApiParam({
        name: 'idOrUsername',
        description: 'User ID (UUID) or unique username',
        example: 'johndoe',
    })
    @ApiResponse({
        status: 200,
        description: 'Paginated list of realtime bricks.',
        type: PaginatedRealtimeBricksResponseDto,
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async getUserRealtimeBricks(
        @Param('idOrUsername') idOrUsername: string,
        @Query() query: GetRealtimeBricksQueryDto,
    ): Promise<PaginatedRealtimeBricksResponseDto> {
        const { data, total, limit, offset } = await this.getUserRealtimeBricksService.execute(
            idOrUsername,
            query,
        );

        return {
            data: data.map((b) =>
                RealtimeBrickResponseDto.fromEntityWithRevenue(
                    b as unknown as Parameters<
                        typeof RealtimeBrickResponseDto.fromEntityWithRevenue
                    >[0],
                ),
            ),
            total,
            limit,
            offset,
        };
    }

    // ─── Get User Brick Stats ─────────────────────────────────────────────────

    @Get('user/:idOrUsername/stats')
    @ApiOperation({
        summary: 'Get public and onchain stats of a user by ID or username',
        description:
            'Returns total bricks uploaded, ipfs bricks, onchain bricks, total upvotes, ' +
            'bricks by tag type, and total received POL donations.',
    })
    @ApiParam({
        name: 'idOrUsername',
        description: 'User ID (UUID) or unique username',
        example: 'johndoe',
    })
    @ApiResponse({
        status: 200,
        description: 'User brick stats.',
        type: UserBrickStatsResponseDto,
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async getUserBrickStats(
        @Param('idOrUsername') idOrUsername: string,
    ): Promise<UserBrickStatsResponseDto> {
        return this.getUserBrickStatsService.execute(idOrUsername);
    }

    // ─── Update Brick Metadata ────────────────────────────────────────────────

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update editable brick metadata (title, description, isPublic)' })
    @ApiBody({ type: UpdateBrickDto })
    @ApiResponse({ status: 200, description: 'Brick updated.', type: BrickResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden — not the brick owner.' })
    @ApiResponse({ status: 404, description: 'Brick not found.' })
    async updateBrick(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateBrickDto,
    ): Promise<BrickResponseDto> {
        const brick = await this.updateBrickService.execute(id, user.id, {
            title: dto.title,
            description: dto.description,
            isPublic: dto.isPublic,
        });
        return BrickResponseDto.fromEntity(brick);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a brick (owner only)' })
    @ApiResponse({ status: 204, description: 'Brick deleted.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden — not the brick owner.' })
    @ApiResponse({ status: 404, description: 'Brick not found.' })
    async deleteBrick(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        await this.deleteBrickService.execute(id, user.id);
    }

    // ─── Delete Single Thumbnail ──────────────────────────────────────────────

    @Delete(':id/thumbnails')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Delete a single thumbnail from a GLB brick',
        description:
            'Removes one thumbnail by its Cloudinary publicId. ' +
            'The brick must retain at least one thumbnail. ' +
            'If the deleted thumbnail was the first, the next one becomes the new watermark.',
    })
    @ApiQuery({
        name: 'publicId',
        required: true,
        description: 'Cloudinary publicId of the thumbnail to delete',
        example: 'BRIX/bricks/abc123',
    })
    @ApiResponse({ status: 200, description: 'Thumbnail deleted.', type: BrickResponseDto })
    @ApiResponse({ status: 400, description: 'Cannot delete the last thumbnail.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Brick or thumbnail not found.' })
    async deleteBrickThumbnail(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('publicId') publicId: string,
    ): Promise<BrickResponseDto> {
        if (!publicId) throw new BadRequestException('publicId query param is required');
        const brick = await this.deleteBrickThumbnailService.execute(id, user.id, publicId);
        return BrickResponseDto.fromEntity(brick);
    }

    // ─── Add Thumbnails ───────────────────────────────────────────────────────

    @Post(':id/thumbnails')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(
        FileFieldsInterceptor([{ name: 'thumbnails', maxCount: 5 }], {
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
        }),
    )
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Add new thumbnail(s) to a GLB brick',
        description:
            'Uploads and appends new thumbnails to the existing list (max 5 total). ' +
            'New images are uploaded with watermark.',
    })
    @ApiBody({
        description: 'Images to add (total brick thumbnails must not exceed 5)',
        schema: {
            type: 'object',
            required: ['thumbnails'],
            properties: {
                thumbnails: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'New thumbnail images (jpg/png/webp)',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Thumbnails added.', type: BrickResponseDto })
    @ApiResponse({ status: 400, description: 'Too many thumbnails or no images provided.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'Brick not found.' })
    async addBrickThumbnails(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFiles() files: { thumbnails?: Express.Multer.File[] },
    ): Promise<BrickResponseDto> {
        if (!files?.thumbnails || files.thumbnails.length === 0) {
            throw new BadRequestException('At least one thumbnail image is required');
        }
        const brick = await this.addBrickThumbnailsService.execute(id, user.id, files.thumbnails);
        return BrickResponseDto.fromEntity(brick);
    }
}
