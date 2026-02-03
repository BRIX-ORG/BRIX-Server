import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserRepository } from './infrastructure';
import {
    CreateUserService,
    UpdateProfileService,
    UpdatePasswordService,
    FindUserService,
    DeleteUserService,
    UserCleanupService,
    UpdateAvatarService,
    UpdateBackgroundService,
} from './application';

@Module({
    controllers: [UsersController],
    providers: [
        // Infrastructure
        UserRepository,
        // Application Services (Use Cases)
        CreateUserService,
        UpdateProfileService,
        UpdatePasswordService,
        FindUserService,
        DeleteUserService,
        UserCleanupService,
        UpdateAvatarService,
        UpdateBackgroundService,
    ],
    exports: [FindUserService, CreateUserService, UserRepository],
})
export class UsersModule {}
