import { Injectable, NotFoundException } from '@nestjs/common';
import { AlbumRepository } from '@albums/infrastructure';

@Injectable()
export class FindAlbumByIdService {
    constructor(private readonly albumRepository: AlbumRepository) {}

    async execute(id: string) {
        const album = await this.albumRepository.findById(id);
        if (!album) throw new NotFoundException('Album not found');
        return album;
    }
}
