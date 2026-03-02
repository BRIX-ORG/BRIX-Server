import { Module } from '@nestjs/common';
import { BricksController } from './bricks.controller';
import {
    BrickRepository,
    VoteRepository,
    CommentRepository,
    CommentVoteRepository,
} from './infrastructure';
import {
    UploadArtService,
    UploadGlbService,
    LikeBrickService,
    CreateCommentService,
    DeleteCommentService,
    GetCommentsService,
    LikeCommentService,
    GetBricksService,
    UpdateBrickService,
    DeleteBrickThumbnailService,
    AddBrickThumbnailsService,
} from './application';
import { QueueModule } from '@/queue';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
    imports: [QueueModule, NotificationsModule],
    controllers: [BricksController],
    providers: [
        // Infrastructure
        BrickRepository,
        VoteRepository,
        CommentRepository,
        CommentVoteRepository,
        // Application Services
        UploadArtService,
        UploadGlbService,
        LikeBrickService,
        CreateCommentService,
        DeleteCommentService,
        GetCommentsService,
        LikeCommentService,
        GetBricksService,
        UpdateBrickService,
        DeleteBrickThumbnailService,
        AddBrickThumbnailsService,
    ],
    exports: [BrickRepository],
})
export class BricksModule {}
