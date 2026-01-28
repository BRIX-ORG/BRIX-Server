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
    CreateUserService,
    UpdateProfileService,
    FindUserService,
    DeleteUserService,
} from '@users/application';
import { CreateUserDto, UpdateProfileDto } from '@users/dto';
import { UserEntity } from '@users/domain';

@Controller('users')
export class UsersController {
    constructor(
        private readonly createUserService: CreateUserService,
        private readonly updateProfileService: UpdateProfileService,
        private readonly findUserService: FindUserService,
        private readonly deleteUserService: DeleteUserService,
    ) {}

    @Get()
    async findAll(): Promise<UserEntity[]> {
        return this.findUserService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<UserEntity> {
        return this.findUserService.findById(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
        return this.createUserService.execute(createUserDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateProfileDto: UpdateProfileDto,
    ): Promise<UserEntity> {
        return this.updateProfileService.execute(id, updateProfileDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string): Promise<void> {
        return this.deleteUserService.execute(id);
    }
}
