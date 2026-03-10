import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserRepository } from './infrastructure';
import { PasswordService } from '@/common';
import { BricksModule } from '../bricks/bricks.module';
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
    imports: [forwardRef(() => BricksModule)],
    controllers: [UsersController],
    providers: [
        // Infrastructure
        UserRepository,
        // Shared Services
        PasswordService,
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
