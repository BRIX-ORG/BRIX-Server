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
    Delete,
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
    DeleteConversationService,
    GetConversationsService,
    GetMessagesService,
    ReadMessagesService,
    GetConversationMediaService,
    GetConversationFilesService,
    GetConversationUnreadCountService,
    GetConversationByIdService,
    GetConversationByPartnerService,
} from '@messages/application';
import { ConversationMemberGuard } from '@messages/guards';
import { GetConversation } from '@messages/decorators/get-conversation.decorator';
import {
    MessagesQueryDto,
    MessageResponseDto,
    PaginatedMessagesResponseDto,
    PaginatedConversationsResponseDto,
    PaginatedMediaResponseDto,
    ConversationResponseDto,
} from '@messages/dto';
import { type Conversation } from '@messages/domain';

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
        private readonly deleteConversationService: DeleteConversationService,
        private readonly getConversationUnreadCountService: GetConversationUnreadCountService,
        private readonly getConversationByIdService: GetConversationByIdService,
        private readonly getConversationByPartnerService: GetConversationByPartnerService,
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

    // ─── Find Conversation by Partner ─────────────────────────────────────────

    @Get('partner/:partnerId')
    @ApiOperation({
        summary: 'Find conversation by partner ID',
        description:
            'Returns conversation details between the current user and the specified partner.',
    })
    @ApiParam({ name: 'partnerId', description: 'Partner User ID (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Conversation details retrieved.',
        type: ConversationResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Conversation or partner not found.' })
    async getConversationByPartner(
        @CurrentUser() user: UserEntity,
        @Param('partnerId', ParseUUIDPipe) partnerId: string,
    ): Promise<ConversationResponseDto> {
        return this.getConversationByPartnerService.execute(user.id, partnerId);
    }

    // ─── Get Conversation Detail ──────────────────────────────────────────────

    @Get(':id')
    @UseGuards(ConversationMemberGuard)
    @ApiOperation({
        summary: 'Get conversation details by ID',
        description:
            'Returns basic info about a conversation, partner, last message, and unread count.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Conversation details retrieved.',
        type: ConversationResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Conversation not found.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    async getConversation(
        @CurrentUser() user: UserEntity,
        @GetConversation() conv: { id: string },
    ): Promise<ConversationResponseDto> {
        return this.getConversationByIdService.execute(conv.id, user.id);
    }

    // ─── Delete Conversation ─────────────────────────────────────────────────

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete a conversation (hidden for the requester)',
        description:
            'Sets hiddenAt timestamp for the current user. Conversation is still visible for the other party.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiResponse({ status: 204, description: 'Conversation hidden.' })
    @ApiResponse({ status: 404, description: 'Conversation not found.' })
    async deleteConversation(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.deleteConversationService.execute(id, user.id);
    }

    // ─── Get Unread Count for Conversation ────────────────────────────────────

    @Get(':id/unread-count')
    @UseGuards(ConversationMemberGuard)
    @ApiOperation({
        summary: 'Get unread message count for a specific conversation',
        description: 'Returns the number of unread messages for the current user.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Unread count retrieved.',
        schema: {
            type: 'object',
            properties: {
                unreadCount: { type: 'number', example: 5 },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getUnreadCount(@CurrentUser() user: UserEntity, @GetConversation() conv: Conversation) {
        return this.getConversationUnreadCountService.execute(conv, user.id);
    }

    // ─── Get Messages in Conversation ─────────────────────────────────────────

    @Get(':id/messages')
    @UseGuards(ConversationMemberGuard)
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
        @CurrentUser() user: UserEntity,
        @GetConversation() conv: Conversation,
        @Query() query: MessagesQueryDto,
    ): Promise<PaginatedMessagesResponseDto> {
        const { data, total, limit, offset } = await this.getMessagesService.execute(
            conv,
            user.id,
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
    @UseGuards(ConversationMemberGuard)
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
    @UseGuards(ConversationMemberGuard)
    @ApiOperation({
        summary: 'Get all images in a conversation',
        description:
            'Returns paginated list of messages containing images. Can optionally include deleted messages.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, example: false })
    @ApiResponse({
        status: 200,
        description: 'Paginated media list.',
        type: PaginatedMediaResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getMedia(
        @CurrentUser() user: UserEntity,
        @GetConversation() conv: Conversation,
        @Query() query: MessagesQueryDto,
    ): Promise<PaginatedMediaResponseDto> {
        return this.getConversationMediaService.execute(
            conv,
            user.id,
            query.limit ?? 20,
            query.offset ?? 0,
            query.includeDeleted,
        );
    }

    // ─── Get All Files in Conversation ────────────────────────────────────────

    @Get(':id/files')
    @UseGuards(ConversationMemberGuard)
    @ApiOperation({
        summary: 'Get all files in a conversation',
        description:
            'Returns paginated list of messages containing file attachments. Can optionally include deleted messages.',
    })
    @ApiParam({ name: 'id', description: 'Conversation ID (UUID)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
    @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, example: false })
    @ApiResponse({
        status: 200,
        description: 'Paginated file list.',
        type: PaginatedMediaResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getFiles(
        @CurrentUser() user: UserEntity,
        @GetConversation() conv: Conversation,
        @Query() query: MessagesQueryDto,
    ): Promise<PaginatedMediaResponseDto> {
        return this.getConversationFilesService.execute(
            conv,
            user.id,
            query.limit ?? 20,
            query.offset ?? 0,
            query.includeDeleted,
        );
    }
}
