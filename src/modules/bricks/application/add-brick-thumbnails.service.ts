import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { WatermarkData } from '@bricks/domain';

@Injectable()
export class AddBrickThumbnailsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async execute(brickId: string, userId: string, newFiles: Express.Multer.File[]) {
        if (!newFiles || newFiles.length === 0) {
            throw new BadRequestException('At least one image is required');
        }

        const brick = await this.prisma.brick.findUnique({ where: { id: brickId } });

        if (!brick) throw new NotFoundException('Brick not found');
        if (brick.userId !== userId)
            throw new ForbiddenException('Not authorized to update this brick');

        const existing = (brick.thumbnail as WatermarkData[] | null) ?? [];

        if (existing.length + newFiles.length > 5) {
            throw new BadRequestException(
                `Cannot add ${newFiles.length} thumbnail(s): would exceed the maximum of 5 ` +
                    `(currently ${existing.length})`,
            );
        }

        // Upload new thumbnails with watermark
        const uploadResults = await Promise.all(
            newFiles.map((file) => this.cloudinaryService.uploadImage(file, 'bricks', true)),
        );

        const added: WatermarkData[] = uploadResults.map((r) => ({
            url: r.url,
            publicId: r.publicId,
            width: r.width,
            height: r.height,
            format: r.format,
        }));

        const merged = [...existing, ...added];

        // First thumbnail is always the watermark
        const watermark = merged[0];

        return this.prisma.brick.update({
            where: { id: brickId },
            data: {
                thumbnail: merged as object[],
                watermark: watermark as object,
            },
        });
    }
}
