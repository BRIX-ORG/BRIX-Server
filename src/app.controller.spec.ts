import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@/prisma';
import { RedisService } from '@/redis';
import { MinioService } from '@/minio';

describe('AppController', () => {
    let appController: AppController;

    const mockHealthCheckService = {
        check: jest
            .fn()
            .mockImplementation(
                async (
                    checks: Array<() => Promise<Record<string, unknown>> | Record<string, unknown>>,
                ) => {
                    const results: Record<string, unknown>[] = [];
                    for (const check of checks) {
                        results.push(await check());
                    }
                    return { status: 'ok', details: results };
                },
            ),
    };

    const mockPrismaHealthIndicator = {
        pingCheck: jest.fn().mockReturnValue({ database: { status: 'up' } }),
    };

    const mockPrismaService = {};
    const mockRedisService = {
        getClient: jest.fn().mockReturnValue({
            ping: jest.fn().mockResolvedValue('PONG'),
        }),
    };
    const mockMinioService = {
        getClient: jest.fn().mockReturnValue({
            bucketExists: jest.fn().mockResolvedValue(true),
        }),
    };

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                AppService,
                { provide: HealthCheckService, useValue: mockHealthCheckService },
                { provide: PrismaHealthIndicator, useValue: mockPrismaHealthIndicator },
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: RedisService, useValue: mockRedisService },
                { provide: MinioService, useValue: mockMinioService },
            ],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return service info', () => {
            const info = appController.getHello();
            expect(info).toBeDefined();
            expect(info.name).toBe('BRIX API');
        });
    });

    describe('health', () => {
        it('should return health status', async () => {
            const health = await appController.check();
            expect(health).toBeDefined();
            expect(health.status).toBe('ok');
        });
    });
});
