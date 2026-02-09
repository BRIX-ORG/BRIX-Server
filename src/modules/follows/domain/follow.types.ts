import { Gender, Provider, Role } from '@prisma/client';

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
