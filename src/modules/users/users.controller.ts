import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiParam,
    ApiExtraModels,
    getSchemaPath,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/response.dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/domain';
import {
    CreateUserService,
    UpdateProfileService,
    UpdatePasswordService,
    FindUserService,
    DeleteUserService,
    UserCleanupService,
    UpdateAvatarService,
    UpdateBackgroundService,
} from '@users/application';
import {
    CreateUserDto,
    UpdateProfileDto,
    UpdatePasswordDto,
    UserResponseDto,
    CloudinaryImageDto,
} from '@users/dto';

@ApiTags('users')
@Controller('users')
@ApiExtraModels(ApiResponseDto, UserResponseDto, CloudinaryImageDto)
export class UsersController {
    constructor(
        private readonly createUserService: CreateUserService,
        private readonly updateProfileService: UpdateProfileService,
        private readonly updatePasswordService: UpdatePasswordService,
        private readonly findUserService: FindUserService,
        private readonly deleteUserService: DeleteUserService,
        private readonly userCleanupService: UserCleanupService,
        private readonly updateAvatarService: UpdateAvatarService,
        private readonly updateBackgroundService: UpdateBackgroundService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all users' })
    @ApiOkResponse({
        description: 'Return all users.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: getSchemaPath(UserResponseDto) },
                        },
                    },
                },
            ],
        },
    })
    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.findUserService.findAll();
        return UserResponseDto.fromEntities(users);
    }

    @Get(':idOrUsername')
    @ApiOperation({ summary: 'Get user by ID or username' })
    @ApiParam({
        name: 'idOrUsername',
        description: 'User ID (UUID) or unique username',
        example: 'johndoe',
    })
    @ApiOkResponse({
        description: 'Return the user.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(UserResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async findOne(@Param('idOrUsername') idOrUsername: string): Promise<UserResponseDto> {
        const user = await this.findUserService.findByIdOrUsername(idOrUsername);
        return UserResponseDto.fromEntity(user);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create user' })
    @ApiCreatedResponse({
        description: 'The user has been successfully created.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(UserResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.createUserService.execute(createUserDto);
        return UserResponseDto.fromEntity(user);
    }

    // ==================== Protected Routes (requires JWT) ====================

    @Put('me/profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiOkResponse({
        description: 'Profile updated successfully.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(UserResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async updateMyProfile(
        @CurrentUser() user: UserEntity,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<UserResponseDto> {
        const updatedUser = await this.updateProfileService.execute(user.id, updateProfileDto);
        return UserResponseDto.fromEntity(updatedUser);
    }

    @Put('me/password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update password for current user' })
    @ApiOkResponse({
        description: 'Password updated successfully.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(UserResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized or incorrect current password.' })
    async updateMyPassword(
        @CurrentUser() user: UserEntity,
        @Body() updatePasswordDto: UpdatePasswordDto,
    ): Promise<UserResponseDto> {
        const updatedUser = await this.updatePasswordService.execute(
            user.id,
            updatePasswordDto.currentPassword,
            updatePasswordDto.newPassword,
        );
        return UserResponseDto.fromEntity(updatedUser);
    }

    @Put('me/avatar')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload/update avatar for current user' })
    @ApiBody({
        description: 'Avatar image file',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (jpg, png, webp, etc.)',
                },
            },
            required: ['file'],
        },
    })
    @ApiOkResponse({
        description: 'Avatar updated successfully.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(UserResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 400, description: 'No file uploaded or invalid file type.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async updateMyAvatar(
        @CurrentUser() user: UserEntity,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<UserResponseDto> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const updatedUser = await this.updateAvatarService.execute(user.id, file);
        return UserResponseDto.fromEntity(updatedUser);
    }

    @Put('me/background')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload/update background for current user' })
    @ApiBody({
        description: 'Background image file',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (jpg, png, webp, etc.)',
                },
            },
            required: ['file'],
        },
    })
    @ApiOkResponse({
        description: 'Background updated successfully.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(UserResponseDto) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 400, description: 'No file uploaded or invalid file type.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async updateMyBackground(
        @CurrentUser() user: UserEntity,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<UserResponseDto> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const updatedUser = await this.updateBackgroundService.execute(user.id, file);
        return UserResponseDto.fromEntity(updatedUser);
    }

    // ==================== Admin Routes ====================

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete user' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({
        status: 204,
        description: 'The user has been successfully deleted.',
        schema: {
            properties: {
                message: { type: 'string', example: 'No Content' },
                code: { type: 'number', example: 204 },
                data: { type: 'object', nullable: true, example: null },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async remove(@Param('id') id: string): Promise<void> {
        return this.deleteUserService.execute(id);
    }

    @Post('cleanup-unverified')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Manual cleanup of unverified users older than 15 minutes' })
    @ApiOkResponse({
        description: 'Cleanup completed successfully.',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'object',
                            properties: {
                                deletedCount: { type: 'number', example: 3 },
                            },
                        },
                    },
                },
            ],
        },
    })
    async cleanupUnverifiedUsers(): Promise<{ deletedCount: number }> {
        const deletedCount = await this.userCleanupService.cleanupUnverifiedUsersNow();
        return { deletedCount };
    }
}
