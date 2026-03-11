import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { BrickRepository } from '@bricks/infrastructure';
import { CloudinaryService } from '@/cloudinary';
import { MinioService } from '@/minio';
import { TagType } from '@prisma/client';
import { MinioFileData, WatermarkData, CloudinaryFileData } from '@bricks/domain';
import { QueueService } from '@/queue';

@Injectable()
export class DeleteBrickService {
    private readonly logger = new Logger(DeleteBrickService.name);

    constructor(
        private readonly brickRepository: BrickRepository,
        private readonly cloudinaryService: CloudinaryService,
        private readonly minioService: MinioService,
        private readonly queueService: QueueService,
    ) {}

    async execute(id: string, userId: string): Promise<void> {
        const brick = await this.brickRepository.findById(id);

        if (!brick) {
            throw new NotFoundException('Brick not found');
        }

        if (brick.userId !== userId) {
            throw new ForbiddenException('Not authorized to delete this brick');
        }

        // Cleanup files
        try {
            if (brick.tagType === TagType.ART) {
                // ART brick: Delete from MinIO (original) and Cloudinary (watermark)
                const media = brick.media as unknown as MinioFileData;
                const watermark = brick.watermark as unknown as WatermarkData;

                if (media?.objectName) {
                    await this.minioService.deleteFile(media.objectName);
                }
                if (watermark?.publicId) {
                    await this.cloudinaryService.deleteFile(watermark.publicId, 'image');
                }
            } else if (brick.tagType === TagType.PRODUCT || brick.tagType === TagType.REALTIME) {
                // GLB brick: Delete GLB and all thumbnails from Cloudinary
                const media = brick.media as unknown as CloudinaryFileData;
                const thumbnails = (brick.thumbnail as unknown as WatermarkData[]) ?? [];

                if (media?.publicId) {
                    await this.cloudinaryService.deleteFile(media.publicId, 'raw');
                }

                for (const thumb of thumbnails) {
                    if (thumb.publicId) {
                        await this.cloudinaryService.deleteFile(thumb.publicId, 'image');
                    }
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error deleting files for brick ${id}: ${message}`);
            // Continue deletion of DB record even if file deletion fails
        }

        await this.brickRepository.delete(id);

        // Remove from Algolia via queue
        void this.queueService.addRemoveBrickJob(id);

        this.logger.log(`Brick ${id} deleted by user ${userId}`);
    }
}
