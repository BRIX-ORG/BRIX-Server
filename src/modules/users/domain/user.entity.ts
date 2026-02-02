import { ApiProperty } from '@nestjs/swagger';
import { UserEntityProps } from './user.types';

export class UserEntity {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'The unique identifier of the user',
    })
    readonly id: string;

    @ApiProperty({ example: 'johndoe', description: 'The unique username of the user' })
    readonly username: string;

    @ApiProperty({ example: 'John Doe', description: 'The full name of the user' })
    readonly fullName: string;

    @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
    readonly email: string;

    @ApiProperty({ example: '0123456789', description: 'The phone number', required: false })
    readonly phone: string | null;

    readonly password: string;

    @ApiProperty({
        example: 'MALE',
        description: 'The gender of the user',
        enum: ['MALE', 'FEMALE', 'OTHER'],
    })
    readonly gender: 'MALE' | 'FEMALE' | 'OTHER';

    @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
    readonly avatar: string | null;

    @ApiProperty({ example: 'https://example.com/bg.png', required: false })
    readonly background: string | null;

    @ApiProperty({ example: '123 Main St', required: false })
    readonly address: string | null;

    @ApiProperty({ example: 'Hello, I am John', required: false })
    readonly shortDescription: string | null;

    @ApiProperty({ example: 4.5, description: 'The trust score of the user' })
    readonly trustScore: number;

    @ApiProperty({ example: 'USER', description: 'The role of the user' })
    readonly role: 'USER' | 'ADMIN';

    @ApiProperty({ example: 'LOCAL', description: 'The auth provider' })
    readonly provider: 'LOCAL' | 'GOOGLE';

    @ApiProperty({ example: false, description: 'Whether the email is verified' })
    readonly isVerified: boolean;

    readonly refreshToken: string | null;

    @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'The date the user was created' })
    readonly createdAt: Date;

    @ApiProperty({
        example: '2024-01-01T00:00:00Z',
        description: 'The date the user was last updated',
    })
    readonly updatedAt: Date;

    constructor(props: UserEntityProps) {
        this.id = props.id;
        this.username = props.username;
        this.fullName = props.fullName;
        this.email = props.email;
        this.phone = props.phone;
        this.password = props.password;
        this.gender = props.gender;
        this.avatar = props.avatar;
        this.background = props.background;
        this.address = props.address;
        this.shortDescription = props.shortDescription;
        this.trustScore = props.trustScore;
        this.role = props.role;
        this.provider = props.provider;
        this.isVerified = props.isVerified;
        this.refreshToken = props.refreshToken;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
