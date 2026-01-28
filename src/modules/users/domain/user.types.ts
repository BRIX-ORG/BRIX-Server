export interface UserEntityProps {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phone: string | null;
    password: string;
    avatar: string | null;
    background: string | null;
    address: string | null;
    shortDescription: string | null;
    trustScore: number;
    role: 'USER' | 'ADMIN';
    provider: 'LOCAL' | 'GOOGLE';
    refreshToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserData {
    username: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface UpdateProfileData {
    fullName?: string;
    phone?: string;
    avatar?: string;
    background?: string;
    address?: string;
    shortDescription?: string;
    trustScore?: number;
    refreshToken?: string;
}
