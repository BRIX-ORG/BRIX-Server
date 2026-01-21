import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Global prefix
    const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
    app.setGlobalPrefix(apiPrefix);

    // CORS
    app.enableCors();

    const port = configService.get<number>('app.port', 3000);
    await app.listen(port);

    console.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
