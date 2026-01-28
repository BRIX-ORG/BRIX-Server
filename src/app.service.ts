import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHealth() {
        const memoryUsage = process.memoryUsage();
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
            },
        };
    }

    getHello() {
        return {
            name: 'BRIX API',
            version: '1.0.0',
            description: 'BRIX Server API Monitoring and Management',
            docs: '/api/docs',
            health: '/api/health',
        };
    }
}
