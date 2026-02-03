import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UserRepository } from '@users/infrastructure';
import { UserEntity, CloudinaryImageData } from '@users/domain';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';

@Injectable()
export class UpdateBackgroundService {
    private readonly logger = new Logger(UpdateBackgroundService.name);

    constructor(
        private readonly userRepository: UserRepository,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async execute(userId: string, file: Express.Multer.File): Promise<UserEntity> {
        // Check if user exists and get current background data
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
            throw new NotFoundException(`User with ID "${userId}" not found`);
        }

        // Upload new background to Cloudinary
        const uploadResult = await this.cloudinaryService.uploadImage(file, 'users/backgrounds');

        const newBackgroundData: CloudinaryImageData = {
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
        };

        // Update user with new background data
        const updatedUser = await this.userRepository.updateBackground(userId, newBackgroundData);

        // Delete old background from Cloudinary if exists and has a valid publicId
        const oldPublicId = existingUser.background?.publicId;
        if (oldPublicId && oldPublicId.length > 0) {
            try {
                await this.cloudinaryService.deleteFile(oldPublicId, 'image');
                this.logger.log(`Deleted old background: ${oldPublicId}`);
            } catch {
                // Log but don't fail the request if deletion fails
                this.logger.warn(`Failed to delete old background: ${oldPublicId}`);
            }
        }

        return updatedUser;
    }
}
