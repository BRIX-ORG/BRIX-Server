import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { NotificationGateway } from './notification.gateway';
import { OnchainGateway } from './onchain.gateway';

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
    providers: [ChatGateway, NotificationGateway, OnchainGateway],
    exports: [ChatGateway, NotificationGateway, OnchainGateway],
})
export class SocketModule {}
