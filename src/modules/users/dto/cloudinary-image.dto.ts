import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Cloudinary image data stored as JSONB
 */
export class CloudinaryImageDto {
    @ApiProperty({
        example:
            'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/BRIX/users/avatars/abc123.webp',
        description: 'Secure URL of the image on Cloudinary',
    })
    url: string;

    @ApiProperty({
        example: 'BRIX/users/avatars/abc123',
        description: 'Public ID used to manage the image on Cloudinary',
    })
    publicId: string;

    @ApiProperty({
        example: 400,
        description: 'Width of the image in pixels',
        required: false,
    })
    width?: number;

    @ApiProperty({
        example: 400,
        description: 'Height of the image in pixels',
        required: false,
    })
    height?: number;

    @ApiProperty({
        example: 'webp',
        description: 'Format of the image (auto-optimized by Cloudinary)',
        required: false,
    })
    format?: string;
}
