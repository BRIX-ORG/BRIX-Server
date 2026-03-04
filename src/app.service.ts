import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
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
