import { Module, forwardRef } from '@nestjs/common';
import {
    BricksController,
    BrickCommentsController,
    BrickVotesController,
    PhotoUploadController,
    BrickNewsfeedController,
} from './controllers';
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
    CreatePhotoSessionService,
    UploadPhotoService,
    GetNewsfeedBricksService,
    GetBrickLocationsService,
    GetFollowingBricksService,
    GetTopAuthorsService,
} from './application';
import { QueueModule } from '@/queue';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { UsersModule } from '@/modules/users/users.module';
import { FollowsModule } from '@/modules/follows/follows.module';

@Module({
    imports: [QueueModule, NotificationsModule, forwardRef(() => UsersModule), FollowsModule],
    controllers: [
        BrickNewsfeedController,
        PhotoUploadController,
        BricksController,
        BrickCommentsController,
        BrickVotesController,
    ],
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
        CreatePhotoSessionService,
        UploadPhotoService,
        GetNewsfeedBricksService,
        GetBrickLocationsService,
        GetFollowingBricksService,
        GetTopAuthorsService,
    ],
    exports: [BrickRepository, GetTopAuthorsService],
})
export class BricksModule {}
