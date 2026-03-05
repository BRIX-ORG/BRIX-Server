import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CommentRepository, BrickRepository } from '@bricks/infrastructure';
import { NotificationBatchService } from '@/modules/notifications/application';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { NotificationType, CommentType } from '@prisma/client';
import { CommentImageData } from '@bricks/domain';

@Injectable()
export class CreateCommentService {
    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly brickRepository: BrickRepository,
        private readonly notificationBatchService: NotificationBatchService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async execute(
        brickId: string,
        userId: string,
        content: string,
        imageFiles?: Express.Multer.File[],
        parentId?: string,
    ) {
        // Validate brick exists
        const brick = await this.brickRepository.findById(brickId);
        if (!brick) throw new NotFoundException('Brick not found');

        // If reply, validate parent comment exists
        let parentOwnerId: string | null = null;
        if (parentId) {
            const parentComment = await this.commentRepository.findById(parentId);
            if (!parentComment) throw new NotFoundException('Parent comment not found');
            parentOwnerId = parentComment.userId;
        }

        // Upload images (no watermark), max 3
        let images: CommentImageData[] | undefined;
        if (imageFiles && imageFiles.length > 0) {
            if (imageFiles.length > 3) {
                throw new BadRequestException('Maximum 3 images allowed per comment');
            }
            const uploadResults = await Promise.all(
                imageFiles.map((file) =>
                    this.cloudinaryService.uploadImage(file, 'bricks/comments', false),
                ),
            );
            images = uploadResults.map((r) => ({
                url: r.url,
                publicId: r.publicId,
                width: r.width,
                height: r.height,
                format: r.format,
            }));
        }

        const type: CommentType = parentId ? CommentType.REPLY : CommentType.COMMENT;

        // Create comment
        const comment = await this.commentRepository.create({
            brickId,
            userId,
            content,
            type,
            parentId,
            images,
        });

        // Batch notifications
        // Notify brick owner of new comment (not self)
        if (brick.userId !== userId) {
            await this.notificationBatchService.addNotification({
                type: NotificationType.COMMENT_BRICK,
                recipientId: brick.userId,
                actorId: userId,
                brickId,
            });
        }

        // Notify parent comment owner of reply (not self, not same as brick owner already notified)
        if (parentOwnerId && parentOwnerId !== userId) {
            await this.notificationBatchService.addNotification({
                type: NotificationType.REPLY_COMMENT,
                recipientId: parentOwnerId,
                actorId: userId,
                brickId,
                commentId: parentId ?? undefined,
            });
        }

        return comment;
    }
}
