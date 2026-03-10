import { Module, forwardRef } from '@nestjs/common';
import { FollowsController } from './follows.controller';
import { FollowRepository } from './infrastructure';
import {
    FollowService,
    GetFollowersService,
    GetFollowingService,
    GetFollowRecommendationsService,
} from './application';
import { UsersModule } from '@users/users.module';
import { NotificationsModule } from '@notifications/notifications.module';

@Module({
    imports: [forwardRef(() => UsersModule), NotificationsModule],
    controllers: [FollowsController],
    providers: [
        // Infrastructure
        FollowRepository,
        // Application Services (Use Cases)
        FollowService,
        GetFollowersService,
        GetFollowingService,
        GetFollowRecommendationsService,
    ],
    exports: [FollowService, FollowRepository],
})
export class FollowsModule {}
