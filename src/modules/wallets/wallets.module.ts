import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { WalletsController } from './wallets.controller';
import { WalletRepository } from './domain';
import { PrismaWalletRepository } from './infrastructure';
import {
    GetWalletNonceService,
    LinkWalletService,
    UnlinkWalletService,
    GetUserWalletsService,
} from './application';

@Module({
    imports: [UsersModule],
    controllers: [WalletsController],
    providers: [
        {
            provide: WalletRepository,
            useClass: PrismaWalletRepository,
        },
        GetWalletNonceService,
        LinkWalletService,
        UnlinkWalletService,
        GetUserWalletsService,
    ],
    exports: [WalletRepository],
})
export class WalletsModule {}
