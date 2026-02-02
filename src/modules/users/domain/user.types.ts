export interface UserEntityProps {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phone: string | null;
    password: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    avatar: string | null;
    background: string | null;
    address: string | null;
    shortDescription: string | null;
    trustScore: number;
    role: 'USER' | 'ADMIN';
    provider: 'LOCAL' | 'GOOGLE';
    isVerified: boolean;
    refreshToken: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserData {
    username: string;
    fullName: string;
    email: string;
    password: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    phone?: string;
    avatar?: string | null;
    provider?: 'LOCAL' | 'GOOGLE';
}

export interface UpdateProfileData {
    fullName?: string;
    phone?: string;
    avatar?: string;
    background?: string;
    address?: string;
    shortDescription?: string;
    trustScore?: number;
    password?: string;
    refreshToken?: string;
    isVerified?: boolean;
}
