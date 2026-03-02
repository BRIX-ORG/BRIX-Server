import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface UpdateBrickData {
    title?: string;
    description?: string;
    isPublic?: boolean;
}

@Injectable()
export class UpdateBrickService {
    constructor(private readonly prisma: PrismaService) {}

    async execute(brickId: string, userId: string, data: UpdateBrickData) {
        const brick = await this.prisma.brick.findUnique({ where: { id: brickId } });

        if (!brick) throw new NotFoundException('Brick not found');
        if (brick.userId !== userId)
            throw new ForbiddenException('Not authorized to update this brick');

        // Only include fields that were actually provided
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined),
        ) as UpdateBrickData;

        return this.prisma.brick.update({
            where: { id: brickId },
            data: updateData,
        });
    }
}
