import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
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
        it('should return health status', () => {
            const health = appController.checkHealth();
            expect(health).toBeDefined();
            expect(health.status).toBe('ok');
        });
    });
});
