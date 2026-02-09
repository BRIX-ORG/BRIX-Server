import { Module } from '@nestjs/common';
import { FollowsController } from './follows.controller';
import { FollowRepository } from './infrastructure';
import { FollowService, GetFollowersService, GetFollowingService } from './application';
import { UsersModule } from '@users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [FollowsController],
    providers: [
        // Infrastructure
        FollowRepository,
        // Application Services (Use Cases)
        FollowService,
        GetFollowersService,
        GetFollowingService,
    ],
    exports: [FollowService, FollowRepository],
})
export class FollowsModule {}
