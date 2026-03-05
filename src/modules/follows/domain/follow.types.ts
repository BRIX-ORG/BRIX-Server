import { Gender, Provider, Role } from '@prisma/client';

export interface PaginationOptions {
    limit?: number;
    offset?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    limit: number | null;
    offset: number;
}

export interface FollowEntityProps {
    followerId: string;
    followingId: string;
    createdAt: Date;
}

export interface FollowerInfo {
    id: string;
    username: string;
    fullName: string;
    avatar: unknown;
    gender: Gender;
    role: Role;
    provider: Provider;
    shortDescription: string | null;
    isFollowing?: boolean; // Whether current user follows this person
}
