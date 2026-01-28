import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '@/common/dto/response.dto';

// Global HTTP Exception Filter
// Catches all HttpException instances and formats them to standard response
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        // Extract message from exception
        let message = exception.message;

        if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
            const responseObj = exceptionResponse as Record<string, unknown>;
            const exceptionMessage = responseObj.message;
            message = Array.isArray(exceptionMessage)
                ? exceptionMessage.join(', ')
                : String(exceptionMessage);
        }

        // Log the error
        this.logger.error(
            `${request.method} ${request.url} - Status: ${status} - Message: ${message}`,
            exception.stack,
        );

        // Create standardized error response
        const errorResponse: ApiResponse<null> = {
            message,
            code: status,
            data: null,
        };

        response.status(status).json(errorResponse);
    }
}

/**
 * Global Exception Filter for all unhandled exceptions
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Determine status code and message
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof Error ? exception.message : 'Internal server error';

        // Log the error with full details
        this.logger.error(
            `${request.method} ${request.url} - Status: ${status} - Message: ${message}`,
            exception instanceof Error ? exception.stack : String(exception),
        );

        // Create standardized error response
        const errorResponse: ApiResponse<null> = {
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
            code: status,
            data: null,
        };

        response.status(status).json(errorResponse);
    }
}
