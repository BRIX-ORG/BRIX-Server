import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';
import { Album, Prisma } from '@prisma/client';
import { AlbumItem } from '@albums/domain';

export interface CreateAlbumData {
    userId: string;
    name: string;
    description?: string;
    background?: string[];
    titleColor?: string;
    descriptionColor?: string;
    items: AlbumItem[]; // JSONB
}

@Injectable()
export class AlbumRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateAlbumData): Promise<Album> {
        return this.prisma.album.create({
            data: {
                userId: data.userId,
                name: data.name,
                description: data.description,
                background: data.background as unknown as Prisma.InputJsonValue,
                titleColor: data.titleColor,
                descriptionColor: data.descriptionColor,
                items: data.items as unknown as Prisma.InputJsonValue,
            },
        });
    }

    async findById(id: string): Promise<Album | null> {
        return this.prisma.album.findUnique({
            where: { id },
        });
    }

    async findByUserId(
        userId: string,
        limit: number = 10,
        offset: number = 0,
    ): Promise<[Album[], number]> {
        const where = { userId };
        return Promise.all([
            this.prisma.album.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.album.count({ where }),
        ]);
    }

    async update(id: string, data: Prisma.AlbumUpdateInput): Promise<Album> {
        return this.prisma.album.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<Album> {
        return this.prisma.album.delete({
            where: { id },
        });
    }
}
