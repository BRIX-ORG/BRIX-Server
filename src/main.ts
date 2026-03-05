import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '@/app.module';
import { ResponseInterceptor, HttpExceptionFilter, AllExceptionsFilter } from '@/common';
import { RedisIoAdapter } from '@/socket/redis-io.adapter';
import { RedisService } from '@/redis/redis.service';
import pc from 'picocolors';
import helmet from 'helmet';
// import cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Middlewares
    app.use(helmet());
    // app.use(cookieParser());

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
    const minioConsolePort = configService.get<string>('minio.consolePort', '9001');
    app.setGlobalPrefix(apiPrefix);

    // CORS
    app.enableCors();

    // Redis IO Adapter
    const redisService = app.get(RedisService);
    const redisIoAdapter = new RedisIoAdapter(app, redisService);
    app.useWebSocketAdapter(redisIoAdapter);

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

    // Enable graceful shutdown
    app.enableShutdownHooks();

    await app.listen(port);

    logger.log(
        pc.blueBright(`Application is running on: `) +
            pc.cyan(`http://localhost:${port}/${apiPrefix}`),
    );
    logger.log(
        pc.blueBright(`Swagger documentation is available at: `) +
            pc.cyan(`http://localhost:${port}/${apiPrefix}/docs`),
    );

    logger.log(
        pc.blueBright(`MinIO Console is available at: `) +
            pc.cyan(`http://localhost:${minioConsolePort}`),
    );

    const redisCommanderPort = configService.get<string>('REDIS_COMMANDER_PORT', '8081');
    logger.log(
        pc.blueBright(`Redis Commander is available at: `) +
            pc.cyan(`http://localhost:${redisCommanderPort}`),
    );
}
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
