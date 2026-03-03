import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Brick, MediaType, TagType } from '@prisma/client';

export interface CreateBrickData {
    userId: string;

    media: any;

    watermark?: any;

    thumbnail?: any;
    title: string;
    description?: string;
    mediaType: MediaType;
    tagType: TagType;
    isPublic?: boolean;
    address?: string;
    latitude?: number;
    longitude?: number;
}

@Injectable()
export class BrickRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: CreateBrickData): Promise<Brick> {
        return this.prisma.brick.create({
            data: {
                userId: data.userId,
                media: data.media as object,
                watermark: data.watermark ? (data.watermark as object) : undefined,
                thumbnail: data.thumbnail ? (data.thumbnail as object) : undefined,
                title: data.title,
                description: data.description,
                mediaType: data.mediaType,
                tagType: data.tagType,
                isPublic: data.isPublic ?? true,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
            },
        });
    }

    async findById(id: string): Promise<Brick | null> {
        return this.prisma.brick.findUnique({
            where: { id },
        });
    }

    async findByIdWithUser(id: string) {
        return this.prisma.brick.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                        gender: true,
                    },
                },
                _count: {
                    select: {
                        votes: true,
                        comments: true,
                    },
                },
            },
        });
    }

    async findByUserId(userId: string): Promise<Brick[]> {
        return this.prisma.brick.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async delete(id: string): Promise<Brick> {
        return this.prisma.brick.delete({
            where: { id },
        });
    }
}
