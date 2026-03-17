import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinataSDK } from 'pinata';

export interface PinataUploadResult {
    id: string;
    cid: string;
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

export interface PinataFileResponse {
    data: unknown;
}

@Injectable()
export class PinataService {
    private readonly logger = new Logger(PinataService.name);
    private pinata: PinataSDK;
    private readonly gateway: string;

    constructor(private readonly configService: ConfigService) {
        const jwt = this.configService.get<string>('PINATA_JWT_KEY');
        this.gateway = this.configService.get<string>('PINATA_GATEWAY', 'gateway.mypinata.cloud');

        if (!jwt) {
            this.logger.warn('PINATA_JWT_KEY is not configured - PinataService will not work');
        }

        this.pinata = new PinataSDK({
            pinataJwt: jwt ?? '',
            pinataGateway: this.gateway,
        });

        this.logger.log(`Pinata service initialized with gateway: ${this.gateway}`);
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    /**
     * Upload a file to IPFS via Pinata
     * @param file - Multer file object
     * @param name - Optional custom name for the file
     * @returns Upload result with CID
     */
    async uploadFile(file: Express.Multer.File, name?: string): Promise<PinataUploadResult> {
        try {
            const fileName = name || file.originalname;
            const uint8Array = new Uint8Array(file.buffer);
            const fileToUpload = new File([uint8Array], fileName, { type: file.mimetype });

            const result = await this.pinata.upload.public.file(fileToUpload);

            this.logger.log(`File uploaded to IPFS: ${result.cid}`);

            return {
                id: result.id,
                cid: result.cid,
                name: result.name,
                size: result.size,
                mimeType: result.mime_type,
                createdAt: result.created_at,
            };
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to upload file to IPFS: ${message}`, stack);
            throw new BadRequestException(`IPFS upload failed: ${message}`);
        }
    }

    /**
     * Upload multiple files to IPFS
     * @param files - Array of Multer file objects
     * @returns Array of upload results
     */
    async uploadMultipleFiles(files: Express.Multer.File[]): Promise<PinataUploadResult[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        const uploadPromises = files.map((file) => this.uploadFile(file));
        return Promise.all(uploadPromises);
    }

    /**
     * Get file content from IPFS by CID
     * @param cid - The IPFS CID
     * @returns File content
     */
    async getFile(cid: string): Promise<unknown> {
        try {
            const data = await this.pinata.gateways.public.get(cid);
            this.logger.log(`File retrieved from IPFS: ${cid}`);
            return data;
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to get file from IPFS: ${message}`, stack);
            throw new BadRequestException(`IPFS get failed: ${message}`);
        }
    }

    /**
     * Get gateway URL for a file by CID
     * @param cid - The IPFS CID
     * @returns Gateway URL string
     */
    async getFileUrl(cid: string): Promise<string> {
        try {
            const url = await this.pinata.gateways.public.convert(cid);
            return url;
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to get gateway URL: ${message}`, stack);
            throw new BadRequestException(`Failed to get gateway URL: ${message}`);
        }
    }

    /**
     * Delete a file from IPFS (unpin)
     * @param cid - The IPFS CID to unpin
     */
    async deleteFile(cid: string): Promise<void> {
        try {
            await this.pinata.files.public.delete([cid]);
            this.logger.log(`File unpinned from IPFS: ${cid}`);
        } catch (error) {
            const message = this.getErrorMessage(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`Failed to unpin file from IPFS: ${message}`, stack);
            throw new BadRequestException(`IPFS unpin failed: ${message}`);
        }
    }

    /**
     * Get the configured gateway URL
     * @returns Gateway URL string
     */
    getGatewayUrl(): string {
        return this.gateway;
    }
}
