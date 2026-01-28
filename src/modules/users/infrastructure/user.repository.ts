import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma';
import { UserEntity, CreateUserData, UpdateProfileData } from '../domain';
import type { User } from '@prisma/client';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<UserEntity[]> {
        const users: User[] = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return users.map((user) => new UserEntity(user));
    }

    async findById(id: string): Promise<UserEntity | null> {
        const user: User | null = await this.prisma.user.findUnique({
            where: { id },
        });
        return user ? new UserEntity(user) : null;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const user: User | null = await this.prisma.user.findUnique({
            where: { email },
        });
        return user ? new UserEntity(user) : null;
    }

    async create(data: CreateUserData): Promise<UserEntity> {
        const user: User = await this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstName: data.firstName ?? null,
                lastName: data.lastName ?? null,
            },
        });
        return new UserEntity(user);
    }

    async update(id: string, data: UpdateProfileData): Promise<UserEntity> {
        const user: User = await this.prisma.user.update({
            where: { id },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
            },
        });
        return new UserEntity(user);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        });
    }

    async exists(id: string): Promise<boolean> {
        const count: number = await this.prisma.user.count({
            where: { id },
        });
        return count > 0;
    }

    async emailExists(email: string): Promise<boolean> {
        const count: number = await this.prisma.user.count({
            where: { email },
        });
        return count > 0;
    }
}
