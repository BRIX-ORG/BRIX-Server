import {
    Controller,
    Post,
    Put,
    Delete,
    Get,
    Body,
    Param,
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
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import {
    SendMessageService,
    UpdateMessageService,
    DeleteMessageService,
    ReactMessageService,
    GetUnreadCountService,
} from '@messages/application';
import {
    SendMessageDto,
    UpdateMessageDto,
    ReactMessageDto,
    MessageResponseDto,
    UnreadCountResponseDto,
} from '@messages/dto';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
    constructor(
        private readonly sendMessageService: SendMessageService,
        private readonly updateMessageService: UpdateMessageService,
        private readonly deleteMessageService: DeleteMessageService,
        private readonly reactMessageService: ReactMessageService,
        private readonly getUnreadCountService: GetUnreadCountService,
    ) {}

    // ─── Send Message ─────────────────────────────────────────────────────────

    @Post()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'images', maxCount: 3 },
                { name: 'voice', maxCount: 1 },
                { name: 'file', maxCount: 1 },
            ],
            { limits: { fileSize: 25 * 1024 * 1024 } }, // 25MB max
        ),
    )
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Send a message',
        description:
            'Send a text/image/voice/file message to another user. ' +
            'Supports multipart/form-data for file uploads. ' +
            'At least one content type (text, images, voice, file, brickId) must be provided. ' +
            'Maximum 3 images per message.',
    })
    @ApiBody({
        description: 'Message content with optional file attachments',
        schema: {
            type: 'object',
            required: ['receiverId'],
            properties: {
                receiverId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Receiver user ID',
                },
                content: {
                    type: 'string',
                    description: 'Text content',
                },
                brickId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Brick ID to share',
                },
                images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Image files (1-3, jpg/png/webp)',
                },
                voice: {
                    type: 'string',
                    format: 'binary',
                    description: 'Voice message file (mp3/m4a/ogg/webm)',
                },
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File attachment (any type)',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Message sent successfully.',
        type: MessageResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid request (no content, too many images).' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async sendMessage(
        @CurrentUser() user: UserEntity,
        @Body() dto: SendMessageDto,
        @UploadedFiles()
        files: {
            images?: Express.Multer.File[];
            voice?: Express.Multer.File[];
            file?: Express.Multer.File[];
        },
    ): Promise<MessageResponseDto> {
        return this.sendMessageService.execute(user.id, dto.receiverId, {
            content: dto.content,
            brickId: dto.brickId,
            imageFiles: files?.images,
            voiceFile: files?.voice?.[0],
            file: files?.file?.[0],
        });
    }

    // ─── Edit Message ─────────────────────────────────────────────────────────

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Edit message content',
        description: 'Edit the text content of a message. Only the sender can edit. Text only.',
    })
    @ApiParam({ name: 'id', description: 'Message ID (UUID)' })
    @ApiBody({ type: UpdateMessageDto })
    @ApiResponse({
        status: 200,
        description: 'Message updated.',
        type: MessageResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden — not the message sender.' })
    @ApiResponse({ status: 404, description: 'Message not found.' })
    async updateMessage(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateMessageDto,
    ): Promise<MessageResponseDto> {
        return this.updateMessageService.execute(id, user.id, dto.content);
    }

    // ─── Delete Message ───────────────────────────────────────────────────────

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete a message (soft delete)',
        description: 'Soft deletes a message. Only the sender can delete.',
    })
    @ApiParam({ name: 'id', description: 'Message ID (UUID)' })
    @ApiResponse({ status: 204, description: 'Message deleted.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden — not the message sender.' })
    @ApiResponse({ status: 404, description: 'Message not found.' })
    async deleteMessage(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        await this.deleteMessageService.execute(id, user.id);
    }

    // ─── React to Message ─────────────────────────────────────────────────────

    @Post(':id/react')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Toggle reaction on a message',
        description:
            'Add or remove an emoji reaction. If the user already reacted with the same emoji, ' +
            'it is removed (toggle behavior).',
    })
    @ApiParam({ name: 'id', description: 'Message ID (UUID)' })
    @ApiBody({ type: ReactMessageDto })
    @ApiResponse({
        status: 200,
        description: 'Reaction toggled.',
        schema: {
            type: 'object',
            properties: {
                messageId: { type: 'string' },
                reactions: {
                    type: 'object',
                    additionalProperties: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                    nullable: true,
                    example: { '👍': ['uuid1'], '❤️': ['uuid2'] },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Message not found.' })
    async reactMessage(
        @CurrentUser() user: UserEntity,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReactMessageDto,
    ) {
        return this.reactMessageService.execute(id, user.id, dto.emoji);
    }

    // ─── Get Unread Count ─────────────────────────────────────────────────────

    @Get('unread-count')
    @ApiOperation({
        summary: 'Get total unread message count',
        description: 'Returns the total number of unread messages across all conversations.',
    })
    @ApiResponse({
        status: 200,
        description: 'Unread count.',
        type: UnreadCountResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getUnreadCount(@CurrentUser() user: UserEntity): Promise<UnreadCountResponseDto> {
        return this.getUnreadCountService.execute(user.id);
    }
}
