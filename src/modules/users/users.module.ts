import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserRepository } from './infrastructure';
import {
    CreateUserService,
    UpdateProfileService,
    FindUserService,
    DeleteUserService,
    UserCleanupService,
} from './application';

@Module({
    controllers: [UsersController],
    providers: [
        // Infrastructure
        UserRepository,
        // Application Services (Use Cases)
        CreateUserService,
        UpdateProfileService,
        FindUserService,
        DeleteUserService,
        UserCleanupService,
    ],
    exports: [FindUserService, CreateUserService, UserRepository],
})
export class UsersModule {}
