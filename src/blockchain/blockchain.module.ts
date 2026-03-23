import { Module } from '@nestjs/common';
import { QueueModule } from '@/queue';
import { OnchainModule } from '@/modules/onchain';
import { BlockchainListenerService } from './blockchain.listener.service';

@Module({
    imports: [QueueModule, OnchainModule],
    providers: [BlockchainListenerService],
    exports: [BlockchainListenerService],
})
export class BlockchainModule {}
