import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma';
import { PinataModule } from '@/pinata';
import { SocketModule } from '@/socket';
import { DistributeIpfsService } from './application/distribute-ipfs.service';
import { MintSuccessService } from './application/mint-success.service';
import { DonateService } from './application/donate.service';
import { GetDonationsService } from './application/get-donations.service';
import { OnchainRepository } from './infrastructure/onchain.repository';

@Module({
    imports: [PrismaModule, PinataModule, SocketModule],
    providers: [
        OnchainRepository,
        DistributeIpfsService,
        MintSuccessService,
        DonateService,
        GetDonationsService,
    ],
    exports: [
        OnchainRepository,
        DistributeIpfsService,
        MintSuccessService,
        DonateService,
        GetDonationsService,
    ],
})
export class OnchainModule {}
