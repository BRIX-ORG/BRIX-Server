import { Module } from '@nestjs/common';
import { BricksController } from './bricks.controller';
import {
    BrickRepository,
    BrickVoteRepository,
    CommentRepository,
    CommentVoteRepository,
} from './infrastructure';
import {
    UploadArtService,
    UploadGlbService,
    VoteBrickService,
    CreateCommentService,
    DeleteCommentService,
    GetCommentsService,
    VoteCommentService,
    GetBricksService,
    UpdateBrickService,
    DeleteBrickThumbnailService,
    AddBrickThumbnailsService,
    DeleteBrickService,
    GetBrickUpvotersService,
    GetCommentUpvotersService,
    UpdateCommentService,
    GetBrickVoteStatusService,
    GetCommentVoteStatusService,
    GetBrickDetailService,
} from './application';
import { QueueModule } from '@/queue';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
    imports: [QueueModule, NotificationsModule, UsersModule],
    controllers: [BricksController],
    providers: [
        // Infrastructure
        BrickRepository,
        BrickVoteRepository,
        CommentRepository,
        CommentVoteRepository,
        // Application Services
        UploadArtService,
        UploadGlbService,
        VoteBrickService,
        CreateCommentService,
        DeleteCommentService,
        GetCommentsService,
        VoteCommentService,
        GetBricksService,
        UpdateBrickService,
        DeleteBrickThumbnailService,
        AddBrickThumbnailsService,
        DeleteBrickService,
        GetBrickUpvotersService,
        GetCommentUpvotersService,
        UpdateCommentService,
        GetBrickVoteStatusService,
        GetCommentVoteStatusService,
        GetBrickDetailService,
    ],
    exports: [BrickRepository],
})
export class BricksModule {}
