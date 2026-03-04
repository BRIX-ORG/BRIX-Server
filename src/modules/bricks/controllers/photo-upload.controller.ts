import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { CreatePhotoSessionService } from '@bricks/application/create-photo-session.service';
import { UploadPhotoService } from '@bricks/application/upload-photo.service';
import { PhotoSessionResponseDto } from '@bricks/dto/photo-session-response.dto';
import { UploadPhotoDto } from '@bricks/dto/upload-photo.dto';

@ApiTags('Bricks')
@Controller('bricks')
export class PhotoUploadController {
    constructor(
        private readonly createPhotoSessionService: CreatePhotoSessionService,
        private readonly uploadPhotoService: UploadPhotoService,
    ) {}

    // ─── Create Photo Session ────────────────────────────────────────────────

    @Post('realtime/session')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create a challenge-based photo capture session',
        description:
            'Generates a short-lived session with a nonce (90s TTL). ' +
            'Client must display the nonce and use the sessionId when uploading. ' +
            'Each session can only be used once.',
    })
    @ApiResponse({
        status: 201,
        description: 'Photo session created.',
        type: PhotoSessionResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async createSession(@CurrentUser() user: UserEntity): Promise<PhotoSessionResponseDto> {
        return this.createPhotoSessionService.execute(user.id);
    }

    // ─── Upload Photo ────────────────────────────────────────────────────────

    @Post('upload/realtime')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        }),
    )
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({
        summary: 'Upload a webcam photo with session validation',
        description:
            'Validates the challenge session (must be valid, not expired, not used), ' +
            'checks image integrity (magic bytes + sharp decode), ' +
            'then queues the upload for background processing via BullMQ. ' +
            'The brick will be created asynchronously with tagType=REALTIME.',
    })
    @ApiBody({
        description: 'Photo file with session metadata',
        schema: {
            type: 'object',
            required: ['file', 'sessionId', 'title'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file from webcam (JPEG or PNG)',
                },
                sessionId: {
                    type: 'string',
                    description: 'Session ID from /photo/session',
                },
                title: { type: 'string' },
                description: { type: 'string' },
                address: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                isPublic: { type: 'boolean', default: true },
            },
        },
    })
    @ApiResponse({
        status: 202,
        description: 'Photo upload accepted and queued for processing.',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Photo upload queued successfully' },
                sessionId: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Invalid session, file, or image format.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async uploadPhoto(
        @CurrentUser() user: UserEntity,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadPhotoDto,
    ): Promise<{ message: string; sessionId: string }> {
        if (!file) throw new BadRequestException('No file uploaded');

        return this.uploadPhotoService.execute(user.id, file, dto.sessionId, dto.title, {
            description: dto.description,
            address: dto.address,
            latitude: dto.latitude,
            longitude: dto.longitude,
            isPublic: dto.isPublic,
        });
    }
}
