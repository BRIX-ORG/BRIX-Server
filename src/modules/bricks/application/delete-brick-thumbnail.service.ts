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
export class DeleteBrickThumbnailService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async execute(brickId: string, userId: string, publicId: string) {
        const brick = await this.prisma.brick.findUnique({ where: { id: brickId } });

        if (!brick) throw new NotFoundException('Brick not found');
        if (brick.userId !== userId)
            throw new ForbiddenException('Not authorized to update this brick');

        const thumbnails = (brick.thumbnail as WatermarkData[] | null) ?? [];

        const index = thumbnails.findIndex((t) => t.publicId === publicId);
        if (index === -1) throw new NotFoundException('Thumbnail not found');

        if (thumbnails.length === 1) {
            throw new BadRequestException(
                'Cannot delete the last thumbnail — brick must have at least one',
            );
        }

        // Delete from Cloudinary
        await this.cloudinaryService.deleteFile(publicId, 'image');

        // Remove from array
        const remaining = [...thumbnails.slice(0, index), ...thumbnails.slice(index + 1)];

        // If deleted thumbnail was the watermark (first), promote the new first
        const newWatermark = remaining[0];

        return this.prisma.brick.update({
            where: { id: brickId },
            data: {
                thumbnail: remaining as object[],
                watermark: newWatermark as object,
            },
        });
    }
}
