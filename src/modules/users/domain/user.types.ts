/**
 * Cloudinary image data stored as JSONB
 */
export interface CloudinaryImageData {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
}

/**
 * Address data stored as JSONB (from LocationIQ)
 */
export interface AddressData {
    lat: string;
    lon: string;
    displayName: string;
    country?: string;
}

export interface UserEntityProps {
    id: string;
    username: string;
    fullName: string;
    email: string;
    phone: string | null;
    password: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    avatar: CloudinaryImageData | null;
    background: CloudinaryImageData | null;
    address: AddressData | null;
    shortDescription: string | null;
    trustScore: number;
    role: 'USER' | 'ADMIN';
    provider: 'LOCAL' | 'GOOGLE';
    verifiedAt: Date | null;
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
    avatar?: CloudinaryImageData | null;
    provider?: 'LOCAL' | 'GOOGLE';
}

export interface UpdateProfileData {
    fullName?: string;
    phone?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    avatar?: CloudinaryImageData | null;
    background?: CloudinaryImageData | null;
    address?: AddressData | null;
    shortDescription?: string;
    trustScore?: number;
    password?: string;
    refreshToken?: string;
    verifiedAt?: Date | null;
}
