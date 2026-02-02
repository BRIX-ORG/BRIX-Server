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
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiParam,
    ApiExtraModels,
    getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/response.dto';
import {
    CreateUserService,
    UpdateProfileService,
    FindUserService,
    DeleteUserService,
    UserCleanupService,
} from '@users/application';
import { CreateUserDto, UpdateProfileDto, UserResponseDto } from '@users/dto';

@ApiTags('users')
@Controller('users')
@ApiExtraModels(ApiResponseDto, UserResponseDto)
export class UsersController {
    constructor(
        private readonly createUserService: CreateUserService,
        private readonly updateProfileService: UpdateProfileService,
        private readonly findUserService: FindUserService,
        private readonly deleteUserService: DeleteUserService,
        private readonly userCleanupService: UserCleanupService,
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

    @Get(':id')
    @ApiOperation({ summary: 'Get user by id' })
    @ApiParam({ name: 'id', description: 'User ID' })
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
    async findOne(@Param('id') id: string): Promise<UserResponseDto> {
        const user = await this.findUserService.findById(id);
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

    @Put(':id')
    @ApiOperation({ summary: 'Update user profile' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiOkResponse({
        description: 'The user has been successfully updated.',
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
    async update(
        @Param('id') id: string,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<UserResponseDto> {
        const user = await this.updateProfileService.execute(id, updateProfileDto);
        return UserResponseDto.fromEntity(user);
    }

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
