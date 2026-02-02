import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { appConfig } from '@/config';
import { PrismaModule } from '@/prisma';
import { UsersModule } from '@/modules/users';
import { AuthModule } from '@/modules/auth';
import { FirebaseModule } from '@/firebase';
import { RedisModule } from '@/redis';
import { EmailModule } from '@/email';
import { QueueModule } from '@/queue';
import { LoggerMiddleware } from '@/common';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            envFilePath: ['.env', '.env.local'],
        }),
        ScheduleModule.forRoot(),
        FirebaseModule,
        RedisModule,
        EmailModule,
        QueueModule,
        PrismaModule,
        UsersModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*path');
    }
}
