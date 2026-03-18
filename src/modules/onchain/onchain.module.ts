import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma';
import { PinataModule } from '@/pinata';
import { SocketModule } from '@/socket';
import { DistributeIpfsService } from './application/distribute-ipfs.service';
import { MintSuccessService } from './application/mint-success.service';
import { OnchainRepository } from './infrastructure/onchain.repository';

@Module({
    imports: [PrismaModule, PinataModule, SocketModule],
    providers: [OnchainRepository, DistributeIpfsService, MintSuccessService],
    exports: [DistributeIpfsService, MintSuccessService],
})
export class OnchainModule {}
