import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '@/common/dto/response.dto';

// Response Interceptor to transform all responses to standard format
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<Response>();

        return next.handle().pipe(
            map((data: T) => {
                const statusCode = response.statusCode;

                // Handle different response scenarios
                let message = 'Success';
                let responseData: T | null = data;

                // If data already has message property, use it
                if (data && typeof data === 'object' && 'message' in data) {
                    const dataObj = data as Record<string, unknown>;
                    message = typeof dataObj.message === 'string' ? dataObj.message : 'Success';
                    responseData = ('data' in dataObj ? dataObj.data : data) as T;
                }

                // Custom messages based on HTTP status codes
                if (statusCode === 201) {
                    message = message === 'Success' ? 'Created' : message;
                } else if (statusCode === 204) {
                    message = message === 'Success' ? 'No Content' : message;
                    responseData = null;
                }

                return {
                    message,
                    code: statusCode,
                    data: responseData as T,
                };
            }),
        );
    }
}
