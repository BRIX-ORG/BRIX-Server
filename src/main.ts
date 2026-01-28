import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor, HttpExceptionFilter, AllExceptionsFilter } from '@/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Global response interceptor
    app.useGlobalInterceptors(new ResponseInterceptor());

    // Global exception filters (order matters: specific to general)
    app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());

    // Global prefix
    const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
    app.setGlobalPrefix(apiPrefix);

    // CORS
    app.enableCors();

    const port = configService.get<number>('app.port', 3000);
    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
