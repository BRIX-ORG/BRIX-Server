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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import {
    CreateCommentService,
    DeleteCommentService,
    GetCommentsService,
    UpdateCommentService,
} from '@bricks/application';
import {
    CreateCommentDto,
    CommentResponseDto,
    PaginatedCommentsResponseDto,
    UpdateCommentDto,
} from '@bricks/dto';

@ApiTags('Bricks')
@Controller('bricks')
export class BrickCommentsController {
    constructor(
        private readonly createCommentService: CreateCommentService,
        private readonly deleteCommentService: DeleteCommentService,
        private readonly getCommentsService: GetCommentsService,
        private readonly updateCommentService: UpdateCommentService,
    ) {}

    // ─── Comments ────────────────────────────────────────────────────────────

    @Post(':id/comments')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(
        FileFieldsInterceptor([{ name: 'images', maxCount: 3 }], {
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
        }),
    )
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create a comment or reply on a brick (up to 3 images, no watermark)',
    })
    @ApiBody({
        description: 'Comment content and optional images',
        schema: {
            type: 'object',
            required: ['content'],
            properties: {
                content: { type: 'string', description: 'Comment text' },
                parentId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Parent comment ID for replies',
                },
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Optional images (max 3, jpg/png/webp)',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Comment created.', type: CommentResponseDto })
    @ApiResponse({ status: 400, description: 'Validation error.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Brick not found.' })
    async createComment(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateCommentDto,
        @UploadedFiles() files?: { images?: Express.Multer.File[] },
    ): Promise<CommentResponseDto> {
        const comment = await this.createCommentService.execute(
            id,
            user.id,
            dto.content,
            files?.images,
            dto.parentId,
        );
        return CommentResponseDto.fromEntity(comment);
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'Get paginated root comments with nested replies for a brick' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({
        name: 'cursor',
        required: false,
        type: String,
        description: 'Last comment ID for cursor pagination',
    })
    @ApiResponse({
        status: 200,
        description: 'Comments list.',
        type: PaginatedCommentsResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Brick not found.' })
    async getComments(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('limit') limit?: string,
        @Query('cursor') cursor?: string,
    ): Promise<PaginatedCommentsResponseDto> {
        const parsedLimit = limit ? parseInt(limit, 10) : 20;
        const { comments, total } = await this.getCommentsService.execute(id, parsedLimit, cursor);
        return {
            comments: comments.map((c) => CommentResponseDto.fromEntity(c)),
            total,
        };
    }

    // ─── Update Comment ───────────────────────────────────────────────────────

    @Put('comments/:commentId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Edit own comment content' })
    @ApiResponse({ status: 200, description: 'Comment updated.', type: CommentResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden — not the comment owner.' })
    @ApiResponse({ status: 404, description: 'Comment not found.' })
    async updateComment(
        @CurrentUser() user: UserEntity,
        @Param('commentId', ParseUUIDPipe) commentId: string,
        @Body() dto: UpdateCommentDto,
    ): Promise<CommentResponseDto> {
        const comment = await this.updateCommentService.execute(commentId, user.id, dto.content);
        return CommentResponseDto.fromEntity(comment);
    }

    // ─── Delete Comment ───────────────────────────────────────────────────────

    @Delete('comments/:commentId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete own comment (or reply)' })
    @ApiResponse({ status: 204, description: 'Comment deleted.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden — not the comment owner.' })
    @ApiResponse({ status: 404, description: 'Comment not found.' })
    async deleteComment(
        @CurrentUser() user: UserEntity,
        @Param('commentId', ParseUUIDPipe) commentId: string,
    ): Promise<void> {
        await this.deleteCommentService.execute(commentId, user.id);
    }
}
