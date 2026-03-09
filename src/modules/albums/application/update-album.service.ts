import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AlbumRepository } from '@albums/infrastructure';

@Injectable()
export class UpdateAlbumService {
    constructor(private readonly albumRepository: AlbumRepository) {}

    async execute(
        id: string,
        userId: string,
        data: {
            name?: string;
            description?: string;
            background?: string[];
            titleColor?: string;
            descriptionColor?: string;
        },
    ) {
        const album = await this.albumRepository.findById(id);
        if (!album) throw new NotFoundException('Album not found');

        if (album.userId !== userId) {
            throw new ForbiddenException('You do not have permission to update this album');
        }

        return this.albumRepository.update(id, data);
    }
}
