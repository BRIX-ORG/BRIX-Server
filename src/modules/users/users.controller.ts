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
} from '@users/application';
import { CreateUserDto, UpdateProfileDto } from '@users/dto';
import { UserEntity } from '@users/domain';

@ApiTags('users')
@Controller('users')
@ApiExtraModels(ApiResponseDto, UserEntity)
export class UsersController {
    constructor(
        private readonly createUserService: CreateUserService,
        private readonly updateProfileService: UpdateProfileService,
        private readonly findUserService: FindUserService,
        private readonly deleteUserService: DeleteUserService,
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
                            items: { $ref: getSchemaPath(UserEntity) },
                        },
                    },
                },
            ],
        },
    })
    async findAll(): Promise<UserEntity[]> {
        return this.findUserService.findAll();
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
                        data: { $ref: getSchemaPath(UserEntity) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async findOne(@Param('id') id: string): Promise<UserEntity> {
        return this.findUserService.findById(id);
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
                        data: { $ref: getSchemaPath(UserEntity) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
        return this.createUserService.execute(createUserDto);
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
                        data: { $ref: getSchemaPath(UserEntity) },
                    },
                },
            ],
        },
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async update(
        @Param('id') id: string,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<UserEntity> {
        return this.updateProfileService.execute(id, updateProfileDto);
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
}
