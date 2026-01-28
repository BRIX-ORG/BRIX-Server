import { ApiProperty } from '@nestjs/swagger';
import { UserEntityProps } from './user.types';

export class UserEntity {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'The unique identifier of the user',
    })
    readonly id: string;

    @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
    readonly email: string;

    @ApiProperty({ example: '********', description: 'The hashed password of the user' })
    readonly password: string;

    @ApiProperty({
        example: 'John',
        description: 'The first name of the user',
        required: false,
        nullable: true,
    })
    readonly firstName: string | null;

    @ApiProperty({
        example: 'Doe',
        description: 'The last name of the user',
        required: false,
        nullable: true,
    })
    readonly lastName: string | null;

    @ApiProperty({ example: true, description: 'Whether the user account is active' })
    readonly isActive: boolean;

    @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date the user was created' })
    readonly createdAt: Date;

    @ApiProperty({
        example: '2024-01-01T00:00:00Z',
        description: 'The date the user was last updated',
    })
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
