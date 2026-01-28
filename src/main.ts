import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '@/app.module';
import { ResponseInterceptor, HttpExceptionFilter, AllExceptionsFilter } from '@/common';
import pc from 'picocolors';

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
            stopAtFirstError: false,
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

    // Swagger
    const swaggerConfig = new DocumentBuilder()
        .setTitle('BRIX API')
        .setDescription('The BRIX API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

    const port = configService.get<number>('app.port', 3000);
    await app.listen(port);

    logger.log(
        pc.blueBright(`Application is running on: `) +
            pc.cyan(`http://localhost:${port}/${apiPrefix}`),
    );
    logger.log(
        pc.blueBright(`Swagger documentation is available at: `) +
            pc.cyan(`http://localhost:${port}/${apiPrefix}/docs`),
    );
}
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
