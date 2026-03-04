import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { MinioService } from '@/minio/minio.service';
import { QueueService } from '../queue.service';
import { PhotoUploadJobData } from '../types';
import { MediaType, TagType } from '@prisma/client';
import { randomUUID } from 'crypto';

@Processor('photo-upload', {
    concurrency: 1, // OCR is CPU-heavy, limit concurrency
})
export class PhotoUploadProcessor extends WorkerHost {
    private readonly logger = new Logger(PhotoUploadProcessor.name);
    private readonly visionUrl: string;
    private readonly minioPublicUrl: string;
    private readonly minioExternalUrl: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly minioService: MinioService,
        private readonly queueService: QueueService,
        private readonly configService: ConfigService,
    ) {
        super();
        this.visionUrl = this.configService.get<string>('VISION_API_URL', 'http://localhost:8000');

        // MinIO URL accessible from Vision container (Docker network)
        this.minioPublicUrl = this.configService.get<string>(
            'MINIO_PUBLIC_URL',
            'http://localhost:9000',
        );

        // MinIO URL used by NestJS (stored in DB)
        const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
        const port = this.configService.get<number>('MINIO_PORT', 9000);
        const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
        this.minioExternalUrl = `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
    }

    async process(job: Job<PhotoUploadJobData>): Promise<void> {
        const {
            userId,
            sessionId,
            title,
            description,
            address,
            latitude,
            longitude,
            isPublic,
            fileBuffer,
            fileMimetype,
            fileOriginalName,
            nonce,
        } = job.data;

        this.logger.log(
            `Processing photo upload job ${job.id} for session ${sessionId}, user ${userId}`,
        );

        try {
            // Reconstruct file buffer from base64
            const buffer = Buffer.from(fileBuffer, 'base64');
            const ext = fileOriginalName.split('.').pop() || 'jpg';
            const objectName = `bricks/${userId}/${randomUUID()}.${ext}`;

            // Build a Multer-compatible file object for Cloudinary
            const multerFile = {
                buffer,
                mimetype: fileMimetype,
                originalname: fileOriginalName,
                fieldname: 'file',
                encoding: '7bit',
                size: buffer.length,
            } as Express.Multer.File;

            // Upload to MinIO and Cloudinary in parallel
            const [minioResult, cloudinaryResult] = await Promise.all([
                this.minioService.uploadFile(objectName, buffer, fileMimetype),
                this.cloudinaryService.uploadImage(multerFile, 'bricks', true), // watermark=true
            ]);

            const media = {
                url: minioResult.url,
                objectName: minioResult.objectName,
                etag: minioResult.etag,
            };

            const watermark = {
                url: cloudinaryResult.url,
                publicId: cloudinaryResult.publicId,
                width: cloudinaryResult.width,
                height: cloudinaryResult.height,
                format: cloudinaryResult.format,
            };

            // ─── OCR Nonce Verification ──────────────────────────────────────
            let isVerified = false;
            if (nonce) {
                try {
                    const accessibleUrl = media.url.replace(
                        this.minioExternalUrl,
                        this.minioPublicUrl,
                    );
                    isVerified = await this.verifyNonceViaOcr(accessibleUrl, nonce);

                    if (isVerified) {
                        this.logger.log(
                            `Nonce "${nonce}" verified in photo for session ${sessionId}`,
                        );
                    } else {
                        this.logger.warn(
                            `Nonce "${nonce}" NOT found in photo for session ${sessionId}`,
                        );
                    }
                } catch (err) {
                    this.logger.error(
                        `OCR verification error: ${err instanceof Error ? err.message : 'Unknown'}`,
                    );
                }
            }

            // Create brick record
            const brick = await this.prisma.brick.create({
                data: {
                    userId,
                    media: media as object,
                    watermark: watermark as object,
                    title,
                    description,
                    mediaType: MediaType.IMAGE,
                    tagType: TagType.REALTIME,
                    isPublic: isPublic ?? true,
                    address,
                    latitude,
                    longitude,
                    metadata: {
                        create: {
                            modelData: {
                                ocr_status: isVerified ? 'verified' : 'failed',
                                nonce: nonce || null,
                            },
                            ...(isVerified ? { verifiedAt: new Date() } : {}),
                        },
                    },
                },
            });

            this.logger.log(`Photo brick created: ${brick.id} for session ${sessionId}`);

            // Dispatch BLIP description job
            await this.queueService.addBrickDescriptionJob(brick.id, media.url);
        } catch (error) {
            this.logger.error(
                `Failed to process photo upload for session ${sessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    private async verifyNonceViaOcr(imageUrl: string, expectedNonce: string): Promise<boolean> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60 * 1000); // 60s timeout

        try {
            const response = await fetch(`${this.visionUrl}/ocr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_url: imageUrl }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Vision OCR API error: ${response.status}`);
            }

            const result = (await response.json()) as { nonces: string[] };

            // Python OCR returns nonces in "BRX-XXXXXX" format
            // Redis stores raw nonce (e.g. "A91DFK"), so we compare with prefix
            const expectedFull = `BRX-${expectedNonce.toUpperCase().trim()}`;

            return result.nonces.some((n) => n.toUpperCase().trim() === expectedFull);
        } finally {
            clearTimeout(timeout);
        }
    }
}
