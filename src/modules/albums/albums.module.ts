import { Module } from '@nestjs/common';
import { AlbumsController } from './albums.controller';
import {
    CreateAlbumService,
    FindUserAlbumsService,
    FindAlbumByIdService,
    UpdateAlbumService,
    DeleteAlbumService,
} from './application';
import { AlbumRepository } from './infrastructure/album.repository';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';

@Module({
    imports: [CloudinaryModule],
    controllers: [AlbumsController],
    providers: [
        AlbumRepository,
        CreateAlbumService,
        FindUserAlbumsService,
        FindAlbumByIdService,
        UpdateAlbumService,
        DeleteAlbumService,
    ],
    exports: [AlbumRepository],
})
export class AlbumsModule {}
