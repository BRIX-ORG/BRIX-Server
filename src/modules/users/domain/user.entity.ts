import { UserEntityProps } from './user.types';

export class UserEntity {
    readonly id: string;
    readonly email: string;
    readonly password: string;
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(props: UserEntityProps) {
        this.id = props.id;
        this.email = props.email;
        this.password = props.password;
        this.firstName = props.firstName;
        this.lastName = props.lastName;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    get fullName(): string {
        return [this.firstName, this.lastName].filter(Boolean).join(' ');
    }
}
