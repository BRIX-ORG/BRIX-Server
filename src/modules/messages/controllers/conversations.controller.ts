import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import {
    GetConversationsService,
    GetMessagesService,
    ReadMessagesService,
    GetConversationMediaService,
    GetConversationFilesService,
} from '@messages/application';
import {
    MessagesQueryDto,
    MessageResponseDto,
    PaginatedMessagesResponseDto,
    PaginatedConversationsResponseDto,
    PaginatedMediaResponseDto,
} from '@messages/dto';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
    constructor(
        private readonly getConversationsService: GetConversationsService,
        private readonly getMessagesService: GetMessagesService,
        private readonly readMessagesService: ReadMessagesService,
        private readonly getConversationMediaService: GetConversationMediaService,
        private readonly getConversationFilesService: GetConversationFilesService,
    ) {}

    // ─── List Conversations ──────────────────────────────────────────────────

    @Get()
    @ApiOperation({
        summary: 'Get conversation list',
        description:
            'Returns paginated list of conversations sorted by updatedAt desc. ' +
            'Each conversation includes partner info, last message, and unread count.',
    })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    @ApiResponse({
        status: 200,
        description: 'Paginated conversation list.',
        type: PaginatedConversationsResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getConversations(
        @CurrentUser() user: UserEntity,
        @Query() query: MessagesQueryDto,
    ): Promise<PaginatedConversationsResponseDto> {
        return this.getConversationsService.execute(user.id, query.limit ?? 20, query.offset ?? 0);
    }

    // ─── Get Messages in Conversation ─────────────────────────────────────────

    @Get(':id/messages')
    @ApiOperation({
        summary: 'Get messages in a conversation',
        description:
            'Returns paginated messages sorted by createdAt desc. ' +
            'Soft-deleted messages are excluded.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 30 })
    @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    @ApiResponse({
        status: 200,
        description: 'Paginated message list.',
        type: PaginatedMessagesResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getMessages(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: MessagesQueryDto,
    ): Promise<PaginatedMessagesResponseDto> {
        const { data, total, limit, offset } = await this.getMessagesService.execute(
            id,
            query.limit ?? 30,
            query.offset ?? 0,
        );

        return {
            data: data.map((m) => MessageResponseDto.fromEntity(m)),
            total,
            limit,
            offset,
        };
    }

    // ─── Mark Messages as Read ────────────────────────────────────────────────

    @Post(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Mark all messages as read in a conversation',
        description: 'Marks all unread messages sent by the other user as read.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Messages marked as read.',
        schema: {
            type: 'object',
            properties: {
                markedAsRead: { type: 'number', description: 'Number of messages marked as read' },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async readMessages(@CurrentUser() user: UserEntity, @Param('id', ParseUUIDPipe) id: string) {
        return this.readMessagesService.execute(id, user.id);
    }

    // ─── Get All Images in Conversation ───────────────────────────────────────

    @Get(':id/media')
    @ApiOperation({
        summary: 'Get all images in a conversation',
        description: 'Returns paginated list of messages containing images.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    @ApiResponse({
        status: 200,
        description: 'Paginated media list.',
        type: PaginatedMediaResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getMedia(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: MessagesQueryDto,
    ): Promise<PaginatedMediaResponseDto> {
        return this.getConversationMediaService.execute(id, query.limit ?? 20, query.offset ?? 0);
    }

    // ─── Get All Files in Conversation ────────────────────────────────────────

    @Get(':id/files')
    @ApiOperation({
        summary: 'Get all files in a conversation',
        description: 'Returns paginated list of messages containing file attachments.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    @ApiResponse({
        status: 200,
        description: 'Paginated file list.',
        type: PaginatedMediaResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getFiles(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: MessagesQueryDto,
    ): Promise<PaginatedMediaResponseDto> {
        return this.getConversationFilesService.execute(id, query.limit ?? 20, query.offset ?? 0);
    }
}
