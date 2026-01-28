import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from '@/app.service';

@ApiTags('system')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOperation({ summary: 'API Root Information' })
    @ApiResponse({
        status: 200,
        description: 'Returns basic API metadata',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Success' },
                code: { type: 'number', example: 200 },
                data: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', example: 'BRIX API' },
                        version: { type: 'string', example: '1.0.0' },
                        description: { type: 'string', example: 'BRIX Server API' },
                        docs: { type: 'string', example: '/api/docs' },
                        health: { type: 'string', example: '/api/health' },
                    },
                },
            },
        },
    })
    getHello() {
        return this.appService.getHello();
    }

    @Get('health')
    @ApiOperation({ summary: 'Check API health status' })
    @ApiResponse({
        status: 200,
        description: 'API is healthy',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Success' },
                code: { type: 'number', example: 200 },
                data: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        timestamp: { type: 'string', example: '2024-01-28T12:00:00.000Z' },
                        uptime: { type: 'number', example: 123.45 },
                        memory: {
                            type: 'object',
                            properties: {
                                rss: { type: 'string', example: '100 MB' },
                                heapTotal: { type: 'string', example: '50 MB' },
                                heapUsed: { type: 'string', example: '30 MB' },
                            },
                        },
                    },
                },
            },
        },
    })
    checkHealth() {
        return this.appService.getHealth();
    }
}
