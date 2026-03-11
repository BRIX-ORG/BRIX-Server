import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { MinioService } from '@/minio/minio.service';
import { QueueService } from '@/queue/queue.service';
import { BrickRepository } from '@bricks/infrastructure';
import { MinioFileData, WatermarkData } from '@bricks/domain';
import { Brick, MediaType, TagType } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadArtService {
    private readonly logger = new Logger(UploadArtService.name);

    constructor(
        private readonly brickRepository: BrickRepository,
        private readonly cloudinaryService: CloudinaryService,
        private readonly minioService: MinioService,
        private readonly queueService: QueueService,
    ) {}

    async execute(
        userId: string,
        file: Express.Multer.File,
        title: string,
        options?: {
            description?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
            isPublic?: boolean;
        },
    ): Promise<Brick> {
        // Validate file is an image
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('File must be an image');
        }

        const ext = file.originalname.split('.').pop() || 'jpg';
        const objectName = `bricks/${userId}/${randomUUID()}.${ext}`;

        this.logger.log(`Uploading art brick for user ${userId}: ${file.originalname}`);

        // Upload to MinIO and Cloudinary in parallel
        const [minioResult, cloudinaryResult] = await Promise.all([
            this.minioService.uploadFile(objectName, file.buffer, file.mimetype),
            this.cloudinaryService.uploadImage(file, 'bricks', true), // watermark=true
        ]);

        const media: MinioFileData = {
            url: minioResult.url,
            objectName: minioResult.objectName,
            etag: minioResult.etag,
        };

        const watermark: WatermarkData = {
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
        };

        // Create brick record
        const brick = await this.brickRepository.create({
            userId,
            media,
            watermark,
            title,
            description: options?.description,
            mediaType: MediaType.IMAGE,
            tagType: TagType.ART,
            isPublic: options?.isPublic ?? true,
            address: options?.address,
            latitude: options?.latitude,
            longitude: options?.longitude,
        });

        this.logger.log(`Art brick created: ${brick.id}`);

        // Dispatch queue job to generate description via BLIP
        const mediaData = brick.media as { url: string };
        await this.queueService.addBrickDescriptionJob(brick.id, mediaData.url);

        // Sync with Algolia via queue
        void this.queueService.addSyncBrickJob(brick.id);

        return brick;
    }
}
