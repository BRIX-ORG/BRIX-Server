import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AlbumRepository } from '@albums/infrastructure';
import { CloudinaryService } from '@/cloudinary';
import { AlbumItem } from '@albums/domain';

@Injectable()
export class DeleteAlbumService {
    constructor(
        private readonly albumRepository: AlbumRepository,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async execute(id: string, userId: string) {
        const album = await this.albumRepository.findById(id);
        if (!album) throw new NotFoundException('Album not found');

        if (album.userId !== userId) {
            throw new ForbiddenException('You do not have permission to delete this album');
        }

        // Delete images from Cloudinary
        const items = album.items as unknown as AlbumItem[];
        const publicIds = items.map((item) => item.image.publicId);

        if (publicIds.length > 0) {
            await this.cloudinaryService.deleteMultipleFiles(publicIds);
        }

        await this.albumRepository.delete(id);
    }
}
