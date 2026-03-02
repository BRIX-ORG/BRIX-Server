/**
 * MinIO file data stored as JSONB
 */
export interface MinioFileData {
    url: string;
    objectName: string;
    etag: string;
}

/**
 * Cloudinary image data stored as JSONB for watermark
 */
export interface WatermarkData {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
}

/**
 * Cloudinary raw file data stored as JSONB (for GLB, etc.)
 */
export interface CloudinaryFileData {
    url: string;
    publicId: string;
    format?: string;
    resourceType?: string;
}

/**
 * Cloudinary image data stored as JSONB in comment (no watermark)
 */
export interface CommentImageData {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
}
