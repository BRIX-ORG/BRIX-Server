import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '@/cloudinary';
import { AlbumRepository } from '@albums/infrastructure';
import { AlbumItem } from '@albums/domain';

@Injectable()
export class CreateAlbumService {
    constructor(
        private readonly albumRepository: AlbumRepository,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async execute(
        userId: string,
        name: string,
        description: string | undefined,
        itemsMetadata: {
            title: string;
            description?: string;
        }[],
        files: Express.Multer.File[],
        globalStyles: {
            background?: string[];
            titleColor?: string;
            descriptionColor?: string;
        },
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one image is required for the album');
        }

        if (files.length > 10) {
            throw new BadRequestException('Album is limited to 10 images');
        }

        if (itemsMetadata.length !== files.length) {
            throw new BadRequestException(
                'The number of page metadata items must match the number of images',
            );
        }

        // Upload images to Cloudinary (no watermark)
        const uploadResults = await this.cloudinaryService.uploadMultipleImages(files, 'albums');

        // Map items
        const items: AlbumItem[] = uploadResults.map((upload, index) => ({
            image: {
                url: upload.url,
                publicId: upload.publicId,
                width: upload.width,
                height: upload.height,
            },
            title: itemsMetadata[index].title,
            description: itemsMetadata[index].description || '',
        }));

        return this.albumRepository.create({
            userId,
            name,
            description,
            background: globalStyles.background,
            titleColor: globalStyles.titleColor,
            descriptionColor: globalStyles.descriptionColor,
            items,
        });
    }
}
