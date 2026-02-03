import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '@users/domain';
import { CloudinaryImageDto } from './cloudinary-image.dto';

export class UserResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'The unique identifier of the user',
    })
    id: string;

    @ApiProperty({ example: 'johndoe', description: 'The unique username of the user' })
    username: string;

    @ApiProperty({ example: 'John Doe', description: 'The full name of the user' })
    fullName: string;

    @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
    email: string;

    @ApiProperty({ example: '0123456789', description: 'The phone number', required: false })
    phone: string | null;

    @ApiProperty({
        example: 'MALE',
        description: 'The gender of the user',
        enum: ['MALE', 'FEMALE', 'OTHER'],
    })
    gender: 'MALE' | 'FEMALE' | 'OTHER';

    @ApiProperty({
        type: CloudinaryImageDto,
        description: 'User avatar image data from Cloudinary',
        required: false,
        nullable: true,
        example: {
            url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/BRIX/users/avatars/abc123.webp',
            publicId: 'BRIX/users/avatars/abc123',
            width: 400,
            height: 400,
            format: 'webp',
        },
    })
    avatar: CloudinaryImageDto | null;

    @ApiProperty({
        type: CloudinaryImageDto,
        description: 'User background image data from Cloudinary',
        required: false,
        nullable: true,
        example: {
            url: 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/BRIX/users/backgrounds/xyz789.webp',
            publicId: 'BRIX/users/backgrounds/xyz789',
            width: 1920,
            height: 1080,
            format: 'webp',
        },
    })
    background: CloudinaryImageDto | null;

    @ApiProperty({ example: '123 Main St', description: 'User address', required: false })
    address: string | null;

    @ApiProperty({
        example: 'Hello, I am John',
        description: 'User short description',
        required: false,
    })
    shortDescription: string | null;

    @ApiProperty({ example: 4.5, description: 'The trust score of the user' })
    trustScore: number;

    @ApiProperty({ example: 'USER', description: 'The role of the user' })
    role: 'USER' | 'ADMIN';

    @ApiProperty({ example: 'LOCAL', description: 'The auth provider' })
    provider: 'LOCAL' | 'GOOGLE';

    @ApiProperty({
        example: null,
        nullable: true,
        description: 'When the email was verified',
    })
    verifiedAt: Date | null;

    @ApiProperty({
        example: '2024-01-01T00:00:00Z',
        description: 'The date the user was created',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2024-01-01T00:00:00Z',
        description: 'The date the user was last updated',
    })
    updatedAt: Date;

    static fromEntity(user: UserEntity): UserResponseDto {
        const dto = new UserResponseDto();
        dto.id = user.id;
        dto.username = user.username;
        dto.fullName = user.fullName;
        dto.email = user.email;
        dto.phone = user.phone;
        dto.gender = user.gender;
        dto.avatar = user.avatar;
        dto.background = user.background;
        dto.address = user.address;
        dto.shortDescription = user.shortDescription;
        dto.trustScore = user.trustScore;
        dto.role = user.role;
        dto.provider = user.provider;
        dto.verifiedAt = user.verifiedAt;
        dto.createdAt = user.createdAt;
        dto.updatedAt = user.updatedAt;
        return dto;
    }

    static fromEntities(users: UserEntity[]): UserResponseDto[] {
        return users.map((user) => this.fromEntity(user));
    }
}
