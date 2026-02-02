import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
    private readonly logger = new Logger(MinioService.name);
    private minioClient: Minio.Client;
    private readonly bucketName: string;

    constructor(private readonly configService: ConfigService) {
        const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
        const port = this.configService.get<number>('MINIO_PORT', 9000);
        const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
        const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin');
        const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
        this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'brix-storage');

        this.minioClient = new Minio.Client({
            endPoint: endpoint,
            port: port,
            useSSL: useSSL,
            accessKey: accessKey,
            secretKey: secretKey,
        });

        this.logger.log(`MinIO client initialized: ${endpoint}:${port}`);
    }

    async onModuleInit() {
        await this.createBucketIfNotExists();
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    private async createBucketIfNotExists(): Promise<void> {
        try {
            const exists = await this.minioClient.bucketExists(this.bucketName);
            if (!exists) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                this.logger.log(`Bucket "${this.bucketName}" created successfully`);

                // Set public read policy for the bucket (optional - remove if you want private storage)
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
                        },
                    ],
                };
                await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
                this.logger.log(`Public read policy set for bucket "${this.bucketName}"`);
            } else {
                this.logger.log(`Bucket "${this.bucketName}" already exists`);
            }
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to create bucket: ${message}`, stack);
            throw error;
        }
    }

    /**
     * Upload a file to MinIO
     * @param objectName - The name/path of the object in the bucket
     * @param buffer - The file buffer
     * @param contentType - The MIME type of the file
     * @returns The uploaded object info
     */
    async uploadFile(
        objectName: string,
        buffer: Buffer,
        contentType: string,
    ): Promise<{ objectName: string; url: string; etag: string }> {
        try {
            const metadata = {
                'Content-Type': contentType,
            };

            const result = await this.minioClient.putObject(
                this.bucketName,
                objectName,
                buffer,
                buffer.length,
                metadata,
            );

            const url = await this.getFileUrl(objectName);

            this.logger.log(`File uploaded successfully: ${objectName}`);

            return {
                objectName,
                url,
                etag: result.etag,
            };
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to upload file: ${message}`, stack);
            throw error;
        }
    }

    /**
     * Get file URL (presigned or public based on bucket policy)
     * @param objectName - The name/path of the object
     * @param usePresigned - Use presigned URL (true) or public URL (false, default)
     * @param expirySeconds - Expiry time in seconds for presigned URL (default: 7 days)
     * @returns The file URL
     */
    async getFileUrl(
        objectName: string,
        usePresigned: boolean = false,
        expirySeconds: number = 7 * 24 * 60 * 60,
    ): Promise<string> {
        try {
            if (usePresigned) {
                // For private buckets, use presigned URL
                return await this.minioClient.presignedGetObject(
                    this.bucketName,
                    objectName,
                    expirySeconds,
                );
            }

            // For public buckets, use direct URL
            const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
            const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
            const port = this.configService.get<number>('MINIO_PORT', 9000);
            const protocol = useSSL ? 'https' : 'http';

            return `${protocol}://${endpoint}:${port}/${this.bucketName}/${objectName}`;
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to get file URL: ${message}`, stack);
            throw error;
        }
    }

    /**
     * Delete a file from MinIO
     * @param objectName - The name/path of the object to delete
     */
    async deleteFile(objectName: string): Promise<void> {
        try {
            await this.minioClient.removeObject(this.bucketName, objectName);
            this.logger.log(`File deleted successfully: ${objectName}`);
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to delete file: ${message}`, stack);
            throw error;
        }
    }

    /**
     * Get file as buffer
     * @param objectName - The name/path of the object
     * @returns The file buffer
     */
    async getFile(objectName: string): Promise<Buffer> {
        try {
            const dataStream = await this.minioClient.getObject(this.bucketName, objectName);
            const chunks: Buffer[] = [];

            return new Promise((resolve, reject) => {
                dataStream.on('data', (chunk: Buffer) => chunks.push(chunk));
                dataStream.on('end', () => resolve(Buffer.concat(chunks)));
                dataStream.on('error', reject);
            });
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to get file: ${message}`, stack);
            throw error;
        }
    }

    /**
     * Check if file exists
     * @param objectName - The name/path of the object
     * @returns True if file exists, false otherwise
     */
    async fileExists(objectName: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(this.bucketName, objectName);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * List all objects in a folder
     * @param prefix - The folder prefix
     * @param recursive - Whether to list recursively
     * @returns Array of object names
     */
    async listFiles(prefix: string = '', recursive: boolean = false): Promise<string[]> {
        try {
            const objectsList: string[] = [];
            const stream = this.minioClient.listObjects(this.bucketName, prefix, recursive);

            return new Promise((resolve, reject) => {
                stream.on('data', (obj) => {
                    if (obj.name) {
                        objectsList.push(obj.name);
                    }
                });
                stream.on('end', () => resolve(objectsList));
                stream.on('error', reject);
            });
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to list files: ${message}`, stack);
            throw error;
        }
    }

    /**
     * Get MinIO client instance (for advanced operations)
     */
    getClient(): Minio.Client {
        return this.minioClient;
    }
}
