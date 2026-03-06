import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { NotificationGateway } from './notification.gateway';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
            }),
        }),
    ],
    providers: [ChatGateway, NotificationGateway],
    exports: [ChatGateway, NotificationGateway],
})
export class SocketModule {}
