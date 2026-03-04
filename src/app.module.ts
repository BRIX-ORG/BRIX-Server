import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CronModule } from '@/cron';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { appConfig, cloudinaryConfig } from '@/config';
import { PrismaModule } from '@/prisma';
import { UsersModule } from '@/modules/users';
import { AuthModule } from '@/modules/auth';
import { FollowsModule } from '@/modules/follows';
import { BricksModule } from '@/modules/bricks';
import { NotificationsModule } from '@/modules/notifications';
import { FirebaseModule } from '@/firebase';
import { RedisModule } from '@/redis';
import { EmailModule } from '@/email';
import { QueueModule } from '@/queue';
import { CloudinaryModule } from '@/cloudinary';
import { MinioModule } from '@/minio';
import { LocationIqModule } from '@/location-iq';
import { SocketModule } from '@/socket';
import { MessagesModule } from '@/modules/messages';
import { HealthModule } from '@/modules/health/health.module';
import { LoggerMiddleware } from '@/common';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, cloudinaryConfig],
            envFilePath: ['.env', '.env.local'],
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 100,
            },
        ]),
        HealthModule,
        CronModule,
        FirebaseModule,
        RedisModule,
        EmailModule,
        QueueModule,
        CloudinaryModule,
        MinioModule,
        LocationIqModule,
        PrismaModule,
        UsersModule,
        AuthModule,
        FollowsModule,
        BricksModule,
        NotificationsModule,
        SocketModule,
        MessagesModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*path');
    }
}
