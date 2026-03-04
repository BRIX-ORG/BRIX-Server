import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { createHmac } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { MinioService } from '@/minio/minio.service';
import { QueueService } from '../queue.service';
import { PhotoUploadJobData } from '../types';
import { MediaType, TagType } from '@prisma/client';
import { randomUUID } from 'crypto';

@Processor('photo-upload', {
    concurrency: 2, // QR decode is fast, safe to run 2 concurrently
})
export class PhotoUploadProcessor extends WorkerHost {
    private readonly logger = new Logger(PhotoUploadProcessor.name);
    private readonly visionUrl: string;
    private readonly minioPublicUrl: string;
    private readonly minioExternalUrl: string;
    private readonly hmacSecret: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly minioService: MinioService,
        private readonly queueService: QueueService,
        private readonly configService: ConfigService,
    ) {
        super();
        this.visionUrl = this.configService.get<string>('VISION_API_URL', 'http://localhost:8000');

        this.hmacSecret = this.configService.get<string>('QR_HMAC_SECRET', 'qrsecret');

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

            // ─── QR Challenge Verification ───────────────────────────────────
            let isVerified = false;
            if (nonce) {
                try {
                    const accessibleUrl = media.url.replace(
                        this.minioExternalUrl,
                        this.minioPublicUrl,
                    );
                    isVerified = await this.verifyQrChallenge(accessibleUrl, nonce);

                    if (isVerified) {
                        this.logger.log(
                            `QR nonce "${nonce}" verified in photo for session ${sessionId}`,
                        );
                    } else {
                        this.logger.warn(
                            `QR nonce "${nonce}" NOT found in photo for session ${sessionId}`,
                        );
                    }
                } catch (err) {
                    this.logger.error(
                        `QR verification error: ${err instanceof Error ? err.message : 'Unknown'}`,
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
                                qr_status: isVerified ? 'verified' : 'failed',
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

    /**
     * Decode QR code from image via Python service, then verify HMAC signature.
     *
     * Flow:
     * 1. Call Python /decode-qr → get raw QR text (base64 JSON)
     * 2. Decode base64 → parse JSON { nonce, ts, sig }
     * 3. Recompute HMAC(secret, nonce|ts) and compare with sig
     * 4. Check nonce matches expected nonce from Redis session
     * 5. Check timestamp is within TTL (90s)
     */
    private async verifyQrChallenge(imageUrl: string, expectedNonce: string): Promise<boolean> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30 * 1000); // 30s timeout (QR is fast)

        try {
            // 1. Call Python service to decode QR codes from image
            const response = await fetch(`${this.visionUrl}/decode-qr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_url: imageUrl }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Vision QR API error: ${response.status}`);
            }

            const result = (await response.json()) as { qr_data: string[] };

            if (!result.qr_data || result.qr_data.length === 0) {
                this.logger.warn('No QR codes found in image');
                return false;
            }

            // 2. Try each decoded QR text
            for (const qrText of result.qr_data) {
                try {
                    // Decode base64 → JSON
                    const decoded = Buffer.from(qrText, 'base64').toString('utf-8');
                    const payload = JSON.parse(decoded) as {
                        nonce: string;
                        ts: number;
                        sig: string;
                    };

                    // 3. Verify HMAC signature
                    const expectedSig = createHmac('sha256', this.hmacSecret)
                        .update(`${payload.nonce}|${payload.ts}`)
                        .digest('hex');

                    if (payload.sig !== expectedSig) {
                        this.logger.warn('QR HMAC signature mismatch');
                        continue;
                    }

                    // 4. Check nonce matches session
                    if (payload.nonce.toUpperCase() !== expectedNonce.toUpperCase()) {
                        this.logger.warn(
                            `QR nonce "${payload.nonce}" does not match expected "${expectedNonce}"`,
                        );
                        continue;
                    }

                    // 5. Check timestamp is within 90s
                    const ageMs = Date.now() - payload.ts;
                    if (ageMs > 90 * 1000) {
                        this.logger.warn(`QR token expired (age: ${Math.round(ageMs / 1000)}s)`);
                        continue;
                    }

                    // All checks passed
                    return true;
                } catch {
                    // This QR text wasn't a valid token, try next
                    continue;
                }
            }

            return false;
        } finally {
            clearTimeout(timeout);
        }
    }
}
