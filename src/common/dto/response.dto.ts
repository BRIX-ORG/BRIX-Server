// Standard API Response Interface
export interface ApiResponse<T = any> {
    message: string;
    code: number;
    data: T;
}

// Helper function to create success response
export function createSuccessResponse<T>(data: T, message = 'Success', code = 200): ApiResponse<T> {
    return {
        message,
        code,
        data,
    };
}

// Helper function to create error response
export function createErrorResponse(message: string, code: number): ApiResponse<null> {
    return {
        message,
        code,
        data: null,
    };
}
