import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '@redis/redis.service';
import { QueueService } from '@/queue/queue.service';
import sharp from 'sharp';

// JPEG: FF D8 FF, PNG: 89 50 4E 47
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

const MIN_FILE_SIZE = 10 * 1024; // 10KB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PhotoSession {
    userId: string;
    nonce: string;
    used: boolean;
}

@Injectable()
export class UploadPhotoService {
    private readonly logger = new Logger(UploadPhotoService.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly queueService: QueueService,
    ) {}

    async execute(
        userId: string,
        file: Express.Multer.File,
        sessionId: string,
        title: string,
        options?: {
            description?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
            isPublic?: boolean;
        },
    ): Promise<{ message: string; sessionId: string }> {
        // 1. Validate session from Redis and get nonce
        const session = await this.validateSession(sessionId, userId);

        // 2. Validate image file
        this.validateFileSize(file.buffer);
        this.validateMagicBytes(file.buffer);
        await this.validateImageDecode(file.buffer);

        // 3. Encode file buffer to base64 and enqueue
        const fileBuffer = file.buffer.toString('base64');

        await this.queueService.addPhotoUploadJob({
            userId,
            sessionId,
            title,
            description: options?.description,
            address: options?.address,
            latitude: options?.latitude,
            longitude: options?.longitude,
            isPublic: options?.isPublic,
            fileBuffer,
            fileMimetype: file.mimetype,
            fileOriginalName: file.originalname,
            nonce: session.nonce,
        });

        this.logger.log(`Photo upload queued for session ${sessionId}, user ${userId}`);

        return {
            message: 'Photo upload queued successfully',
            sessionId,
        };
    }

    /**
     * Validate the session: exists, not expired, not used, userId matches
     * Then mark as consumed (delete from Redis).
     */
    private async validateSession(sessionId: string, userId: string): Promise<PhotoSession> {
        const key = `photo-session:${sessionId}`;
        const session = await this.redisService.get<PhotoSession>(key);

        if (!session) {
            throw new BadRequestException(
                'Invalid or expired photo session. Please create a new session.',
            );
        }

        if (session.used) {
            throw new BadRequestException(
                'This photo session has already been used. Please create a new session.',
            );
        }

        if (session.userId !== userId) {
            throw new UnauthorizedException('Session does not belong to the current user.');
        }

        // Consume session — delete from Redis
        await this.redisService.delete(key);

        return session;
    }

    /**
     * Check file size: 10KB ≤ size ≤ 10MB
     */
    private validateFileSize(buffer: Buffer): void {
        if (buffer.length < MIN_FILE_SIZE) {
            throw new BadRequestException(
                `Image file is too small (${buffer.length} bytes). Minimum size is 10KB.`,
            );
        }
        if (buffer.length > MAX_FILE_SIZE) {
            throw new BadRequestException(
                `Image file is too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`,
            );
        }
    }

    /**
     * Check magic bytes to verify the file is actually a JPEG or PNG image
     */
    private validateMagicBytes(buffer: Buffer): void {
        const isJpeg = buffer.subarray(0, 3).equals(JPEG_MAGIC);
        const isPng = buffer.subarray(0, 4).equals(PNG_MAGIC);

        if (!isJpeg && !isPng) {
            throw new BadRequestException(
                'Invalid image file. Only JPEG and PNG images are accepted.',
            );
        }
    }

    /**
     * Try to decode the image using sharp to verify it's a valid image
     */
    private async validateImageDecode(buffer: Buffer): Promise<void> {
        try {
            await sharp(buffer).metadata();
        } catch {
            throw new BadRequestException(
                'Failed to decode image. The file appears to be corrupted or not a valid image.',
            );
        }
    }
}
