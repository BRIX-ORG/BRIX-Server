/**
 * MinIO file data stored as JSONB for message file attachment
 */
export interface MessageFileData {
    url: string;
    objectName: string;
    etag: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

/**
 * MinIO image data stored as JSONB for message images (1-3)
 */
export interface MessageImageData {
    url: string;
    objectName: string;
    etag: string;
    width?: number;
    height?: number;
}

/**
 * MinIO voice data stored as JSONB for voice messages
 */
export interface MessageVoiceData {
    url: string;
    objectName: string;
    etag: string;
    duration: number; // seconds
    mimeType: string;
}

/**
 * Reactions JSONB format: { "👍": ["userId1"], "❤️": ["userId2", "userId3"] }
 */
export type MessageReactions = Record<string, string[]>;
