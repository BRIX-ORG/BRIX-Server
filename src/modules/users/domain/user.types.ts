export interface UserEntityProps {
    id: string;
    email: string;
    password: string;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
}
