import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadResult {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
    resourceType?: string;
}

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);
    private readonly baseFolder = 'BRIX';

    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    /**
     * Upload a single image file
     * @param file - Multer file object
     * @param subfolder - Optional subfolder under BRIX (e.g., 'users', 'posts')
     */
    async uploadImage(file: Express.Multer.File, subfolder?: string): Promise<UploadResult> {
        const folder = subfolder ? `${this.baseFolder}/${subfolder}` : this.baseFolder;

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
                },
                (error, result: UploadApiResponse) => {
                    if (error) {
                        this.logger.error(`Image upload failed: ${error.message}`);
                        reject(new BadRequestException(`Upload failed: ${error.message}`));
                    } else {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                            width: result.width,
                            height: result.height,
                            format: result.format,
                            resourceType: 'image',
                        });
                    }
                },
            );

            uploadStream.end(file.buffer);
        });
    }

    /**
     * Upload a GLB/3D model file
     * @param file - Multer file object
     * @param subfolder - Optional subfolder under BRIX
     */
    async uploadGlbFile(file: Express.Multer.File, subfolder?: string): Promise<UploadResult> {
        const folder = subfolder ? `${this.baseFolder}/${subfolder}` : this.baseFolder;

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'raw', // GLB files are uploaded as raw
                    format: 'glb',
                },
                (error, result: UploadApiResponse) => {
                    if (error) {
                        this.logger.error(`GLB upload failed: ${error.message}`);
                        reject(new BadRequestException(`Upload failed: ${error.message}`));
                    } else {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                            format: result.format,
                            resourceType: 'raw',
                        });
                    }
                },
            );

            uploadStream.end(file.buffer);
        });
    }

    /**
     * Upload multiple image files
     * @param files - Array of Multer file objects
     * @param subfolder - Optional subfolder under BRIX
     */
    async uploadMultipleImages(
        files: Express.Multer.File[],
        subfolder?: string,
    ): Promise<UploadResult[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        const uploadPromises = files.map((file) => this.uploadImage(file, subfolder));
        return Promise.all(uploadPromises);
    }

    /**
     * Upload multiple GLB files
     * @param files - Array of Multer file objects
     * @param subfolder - Optional subfolder under BRIX
     */
    async uploadMultipleGlbFiles(
        files: Express.Multer.File[],
        subfolder?: string,
    ): Promise<UploadResult[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        const uploadPromises = files.map((file) => this.uploadGlbFile(file, subfolder));
        return Promise.all(uploadPromises);
    }

    /**
     * Delete a single file by public ID
     * @param publicId - Cloudinary public ID
     * @param resourceType - 'image' or 'raw'
     */
    async deleteFile(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            this.logger.log(`Deleted file: ${publicId}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to delete file: ${message}`);
            throw new BadRequestException(`Failed to delete file: ${message}`);
        }
    }

    /**
     * Delete multiple files by public IDs
     * @param publicIds - Array of Cloudinary public IDs
     * @param resourceType - 'image' or 'raw'
     */
    async deleteMultipleFiles(
        publicIds: string[],
        resourceType: 'image' | 'raw' = 'image',
    ): Promise<void> {
        if (!publicIds || publicIds.length === 0) {
            return;
        }

        try {
            await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
            this.logger.log(`Deleted ${publicIds.length} files`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to delete files: ${message}`);
            throw new BadRequestException(`Failed to delete files: ${message}`);
        }
    }
}
