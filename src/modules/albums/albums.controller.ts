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
    UploadedFiles,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import {
    CreateAlbumService,
    FindUserAlbumsService,
    FindAlbumByIdService,
    UpdateAlbumService,
    DeleteAlbumService,
} from './application';
import {
    CreateAlbumDto,
    UpdateAlbumDto,
    AlbumResponseDto,
    AlbumsQueryDto,
    PaginatedAlbumsResponseDto,
} from './dto';

@ApiTags('Albums')
@Controller('albums')
export class AlbumsController {
    constructor(
        private readonly createAlbumService: CreateAlbumService,
        private readonly findUserAlbumsService: FindUserAlbumsService,
        private readonly findAlbumByIdService: FindAlbumByIdService,
        private readonly updateAlbumService: UpdateAlbumService,
        private readonly deleteAlbumService: DeleteAlbumService,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FilesInterceptor('images', 10))
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new album (max 10 images)' })
    @ApiBody({
        description:
            'Album data and image files. "items" should be a JSON string or array of {title, description}. Colors are album-level fields.',
        schema: {
            type: 'object',
            required: ['name', 'items', 'images'],
            properties: {
                name: { type: 'string', example: 'My Vacation' },
                description: { type: 'string', example: 'Photos from my trip' },
                backgroundColor: {
                    type: 'string',
                    example: '#ffffff',
                    description: 'Global background color (Hex)',
                },
                titleColor: {
                    type: 'string',
                    example: '#000000',
                    description: 'Global title text color (Hex)',
                },
                descriptionColor: {
                    type: 'string',
                    example: '#666666',
                    description: 'Global description text color (Hex)',
                },
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            description: { type: 'string' },
                        },
                    },
                    description: 'Metadata for each page (JSON stringified if using raw multipart)',
                },
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                },
            },
        },
    })
    @ApiResponse({ status: 201, type: AlbumResponseDto })
    async create(
        @CurrentUser() user: UserEntity,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: CreateAlbumDto,
    ): Promise<AlbumResponseDto> {
        const album = await this.createAlbumService.execute(
            user.id,
            dto.name,
            dto.description,
            dto.items,
            files,
            {
                backgroundColor: dto.backgroundColor,
                titleColor: dto.titleColor,
                descriptionColor: dto.descriptionColor,
            },
        );
        return AlbumResponseDto.fromEntity(album);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all albums of the current user (paginated)' })
    @ApiResponse({ status: 200, type: PaginatedAlbumsResponseDto })
    async getMyAlbums(
        @CurrentUser() user: UserEntity,
        @Query() query: AlbumsQueryDto,
    ): Promise<PaginatedAlbumsResponseDto> {
        const result = await this.findUserAlbumsService.execute(user.id, query.limit, query.offset);
        return {
            data: result.data.map((a) => AlbumResponseDto.fromEntity(a)),
            total: result.total,
            limit: result.limit,
            offset: result.offset,
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get detailed information of an album (public)' })
    @ApiResponse({ status: 200, type: AlbumResponseDto })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AlbumResponseDto> {
        const album = await this.findAlbumByIdService.execute(id);
        return AlbumResponseDto.fromEntity(album);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update album metadata (name, description, colors)' })
    @ApiResponse({ status: 200, type: AlbumResponseDto })
    async update(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAlbumDto,
    ): Promise<AlbumResponseDto> {
        const album = await this.updateAlbumService.execute(id, user.id, dto);
        return AlbumResponseDto.fromEntity(album);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an album and its images from Cloudinary' })
    @ApiResponse({ status: 204 })
    async remove(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        await this.deleteAlbumService.execute(id, user.id);
    }
}
