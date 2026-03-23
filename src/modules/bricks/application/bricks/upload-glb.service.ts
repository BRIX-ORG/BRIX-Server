import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { QueueService } from '@/queue/queue.service';
import { BrickRepository } from '@bricks/infrastructure';
import { CloudinaryFileData, WatermarkData } from '@bricks/domain';
import { Brick, MediaType, TagType } from '@prisma/client';

@Injectable()
export class UploadGlbService {
    private readonly logger = new Logger(UploadGlbService.name);

    constructor(
        private readonly brickRepository: BrickRepository,
        private readonly cloudinaryService: CloudinaryService,
        private readonly queueService: QueueService,
    ) {}

    async execute(
        userId: string,
        glbFile: Express.Multer.File,
        thumbnailFiles: Express.Multer.File[],
        title: string,
        options?: {
            description?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
            isPublic?: boolean;
        },
    ): Promise<Brick> {
        // Validate GLB file
        const glbMimeTypes = ['model/gltf-binary', 'application/octet-stream'];
        if (
            !glbMimeTypes.includes(glbFile.mimetype) &&
            !glbFile.originalname.toLowerCase().endsWith('.glb')
        ) {
            throw new BadRequestException('GLB file must be a .glb file');
        }

        // Validate all thumbnails are images
        for (const thumb of thumbnailFiles) {
            if (!thumb.mimetype.startsWith('image/')) {
                throw new BadRequestException(`Thumbnail "${thumb.originalname}" must be an image`);
            }
        }

        this.logger.log(
            `Uploading GLB brick for user ${userId}: ${glbFile.originalname} with ${thumbnailFiles.length} thumbnail(s)`,
        );

        // Upload GLB to Cloudinary
        const glbResult = await this.cloudinaryService.uploadGlbFile(glbFile, 'bricks/glb');

        // Upload all thumbnails to Cloudinary with watermark in parallel
        const thumbnailResults = await Promise.all(
            thumbnailFiles.map((thumb) =>
                this.cloudinaryService.uploadImage(thumb, 'bricks', true),
            ),
        );

        const media: CloudinaryFileData = {
            url: glbResult.url,
            publicId: glbResult.publicId,
            format: glbResult.format,
            resourceType: glbResult.resourceType,
        };

        // Store thumbnails as array of WatermarkData in JSONB
        const thumbnails: WatermarkData[] = thumbnailResults.map((result) => ({
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            format: result.format,
        }));

        // First thumbnail is the main watermark
        const watermark = thumbnails[0];

        // Create brick record
        const brick = await this.brickRepository.create({
            userId,
            media,
            watermark,
            thumbnail: thumbnails, // All thumbnails as JSONB array
            title,
            description: options?.description,
            mediaType: MediaType.GLTF,
            tagType: TagType.PRODUCT,
            isPublic: options?.isPublic ?? true,
            address: options?.address,
            latitude: options?.latitude,
            longitude: options?.longitude,
        });

        this.logger.log(`GLB brick created: ${brick.id}`);

        // Dispatch queue job to generate description from first thumbnail
        await this.queueService.addBrickDescriptionJob(brick.id, watermark.url);

        // Sync with Algolia via queue
        void this.queueService.addSyncBrickJob(brick.id);

        return brick;
    }
}
