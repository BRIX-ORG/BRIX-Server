export interface PhotoUploadJobData {
    userId: string;
    sessionId: string;
    title: string;
    description?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    isPublic?: boolean;
    fileBuffer: string; // base64-encoded image buffer
    fileMimetype: string;
    fileOriginalName: string;
    nonce: string; // Nonce to verify via OCR
}
