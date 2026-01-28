import { ApiProperty } from '@nestjs/swagger';

// Standard API Response Class for Swagger Documentation
export class ApiResponseDto<T> {
    @ApiProperty({ example: 'Success', description: 'Response message' })
    message: string;

    @ApiProperty({ example: 200, description: 'HTTP status code' })
    code: number;

    @ApiProperty({ description: 'Response data' })
    data: T;
}

// Helper function to create success response
export function createSuccessResponse<T>(
    data: T,
    message = 'Success',
    code = 200,
): ApiResponseDto<T> {
    return {
        message,
        code,
        data,
    };
}

// Helper function to create error response
export function createErrorResponse(message: string, code: number): ApiResponseDto<null> {
    return {
        message,
        code,
        data: null,
    };
}
