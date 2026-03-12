import { MediaType, TagType, CommentType } from '@prisma/client';

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

// Re-export Prisma enums for external use
export { MediaType, TagType, CommentType };

/**
 * Data for creating a new brick
 */
export interface CreateBrickData {
    userId: string;
    media: any;
    watermark?: any;
    thumbnail?: any;
    title: string;
    description?: string;
    mediaType: MediaType;
    tagType: TagType;
    isPublic?: boolean;
    address?: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Filter options for finding bricks
 */
export interface FindBricksFilter {
    userId: string;
    isPublic?: boolean;
    tagType?: TagType;
}

/**
 * Filter options for newsfeed bricks
 */
export interface FindNewsfeedBricksFilter {
    timeRange?: string; // DAY, WEEK, MONTH, ALL
    isPublic?: boolean;
    tagType?: TagType;
    limit: number;
    offset: number;
}

/**
 * Filter options for finding brick locations
 */
export interface FindBrickLocationsFilter {
    userId?: string;
    isPublic?: boolean;
    tagType?: TagType;
}

/**
 * Filter options for following bricks
 */
export interface FindFollowingBricksFilter {
    userIds: string[];
    isPublic?: boolean;
    tagType?: TagType;
    limit: number;
    offset: number;
}

/**
 * Data for creating a new comment
 */
export interface CreateCommentData {
    brickId: string;
    userId: string;
    content: string;
    type: CommentType;
    parentId?: string;
    images?: CommentImageData[];
}

/**
 * Vote result for bricks and comments
 */
export interface VoteResult {
    userVote: 1 | -1 | 0;
    upvoteCount: number;
    downvoteCount: number;
    score: number;
}
