import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { UserEntity, CloudinaryImageData } from '@users/domain';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';

@Injectable()
export class UpdateAvatarService {
    private readonly logger = new Logger(UpdateAvatarService.name);

    constructor(
        private readonly userRepository: UserRepository,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async execute(userId: string, file: Express.Multer.File): Promise<UserEntity> {
        // Check if user exists and get current avatar data
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
            throw new NotFoundException(`User with ID "${userId}" not found`);
        }

        // Upload new avatar to Cloudinary
        const uploadResult = await this.cloudinaryService.uploadImage(file, 'users/avatars');

        const newAvatarData: CloudinaryImageData = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
        };

        // Update user with new avatar data
        const updatedUser = await this.userRepository.updateAvatar(userId, newAvatarData);

        // Delete old avatar from Cloudinary if exists and has a valid publicId
        // Note: Google OAuth avatars have empty publicId, so we skip deletion for those
        const oldPublicId = existingUser.avatar?.publicId;
        if (oldPublicId && oldPublicId.length > 0) {
            try {
                await this.cloudinaryService.deleteFile(oldPublicId, 'image');
                this.logger.log(`Deleted old avatar: ${oldPublicId}`);
            } catch {
                // Log but don't fail the request if deletion fails
                this.logger.warn(`Failed to delete old avatar: ${oldPublicId}`);
            }
        }

        return updatedUser;
    }
}
