import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '@/prisma';
import { PinataModule } from '@/pinata';
import { SocketModule } from '@/socket';
import { UsersModule } from '@/modules/users/users.module';
import { DistributeIpfsService } from './application/distribute-ipfs.service';
import { MintSuccessService } from './application/mint-success.service';
import { DonateService } from './application/donate.service';
import { GetDonationsService } from './application/get-donations.service';
import { GetUserOnchainActivitiesService } from './application/get-user-onchain-activities.service';
import { GetUserDonationsService } from './application/get-user-donations.service';
import { OnchainRepository } from './infrastructure/onchain.repository';
import { OnchainController } from './onchain.controller';

@Module({
    imports: [PrismaModule, PinataModule, SocketModule, forwardRef(() => UsersModule)],
    controllers: [OnchainController],
    providers: [
        OnchainRepository,
        DistributeIpfsService,
        MintSuccessService,
        DonateService,
        GetDonationsService,
        GetUserOnchainActivitiesService,
        GetUserDonationsService,
    ],
    exports: [
        OnchainRepository,
        DistributeIpfsService,
        MintSuccessService,
        DonateService,
        GetDonationsService,
        GetUserOnchainActivitiesService,
        GetUserDonationsService,
    ],
})
export class OnchainModule {}
