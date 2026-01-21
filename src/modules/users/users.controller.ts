import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    async findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<User | null> {
        return this.usersService.findOne(id);
    }

    @Post()
    async create(@Body() userData: Partial<User>): Promise<User> {
        return this.usersService.create(userData);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() userData: Partial<User>): Promise<User | null> {
        return this.usersService.update(id, userData);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.usersService.remove(id);
    }
}
