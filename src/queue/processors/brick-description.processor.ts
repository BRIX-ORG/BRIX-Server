import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { BrickDescriptionJobData } from '@/queue/types';

@Processor('brick-description', {
    concurrency: 4,
})
export class BrickDescriptionProcessor extends WorkerHost {
    private readonly logger = new Logger(BrickDescriptionProcessor.name);
    private readonly visionUrl: string;
    private readonly minioPublicUrl: string;
    private readonly minioExternalUrl: string;

    constructor(
        private readonly prisma: PrismaService,
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

    async process(job: Job<BrickDescriptionJobData>): Promise<void> {
        const { brickId, imageUrl } = job.data;
        this.logger.log(`Processing brick description job ${job.id} for brick ${brickId}`);

        try {
            // Replace MinIO URL with one accessible from Vision container
            const accessibleUrl = imageUrl.replace(this.minioExternalUrl, this.minioPublicUrl);
            this.logger.log(`Image URL: ${imageUrl} -> ${accessibleUrl}`);

            // Call Vision service to generate description (BLIP)
            const description = await this.generateDescription(accessibleUrl);

            // Update brick with generated description
            await this.prisma.brick.update({
                where: { id: brickId },
                data: { generatedDescription: description },
            });

            this.logger.log(
                `Generated description for brick ${brickId}: "${description.substring(0, 80)}..."`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to generate description for brick ${brickId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    private async generateDescription(imageUrl: string): Promise<string> {
        // 5 minute timeout — BLIP on CPU should be fast (~10-15s) but just in case
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);

        try {
            const response = await fetch(`${this.visionUrl}/describe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: imageUrl,
                    prompt: 'Describe this image in detail.',
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Vision API error: ${response.status} ${response.statusText}`);
            }

            const result = (await response.json()) as { description: string };
            return result.description;
        } finally {
            clearTimeout(timeout);
        }
    }
}
