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

    async findByUsername(username: string): Promise<UserEntity | null> {
        const user: User | null = await this.prisma.user.findUnique({
            where: { username },
        });
        return user ? new UserEntity(user) : null;
    }

    async findByUsernameOrEmail(identifier: string): Promise<UserEntity | null> {
        const user: User | null = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { username: identifier }],
            },
        });
        return user ? new UserEntity(user) : null;
    }

    async create(data: CreateUserData): Promise<UserEntity> {
        const user: User = await this.prisma.user.create({
            data: {
                username: data.username,
                fullName: data.fullName,
                email: data.email,
                password: data.password,
                phone: data.phone ?? null,
                avatar: data.avatar ?? null,
                provider: data.provider ?? 'LOCAL',
            },
        });
        return new UserEntity(user);
    }

    async update(id: string, data: UpdateProfileData): Promise<UserEntity> {
        const user: User = await this.prisma.user.update({
            where: { id },
            data: {
                fullName: data.fullName,
                phone: data.phone,
                avatar: data.avatar,
                background: data.background,
                address: data.address,
                shortDescription: data.shortDescription,
                trustScore: data.trustScore,
                refreshToken: data.refreshToken,
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

    async usernameExists(username: string): Promise<boolean> {
        const count: number = await this.prisma.user.count({
            where: { username },
        });
        return count > 0;
    }
}
