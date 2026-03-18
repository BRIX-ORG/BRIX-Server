import { Module } from '@nestjs/common';
import { QueueModule } from '@/queue';
import { BlockchainListenerService } from './blockchain.listener.service';

@Module({
    imports: [QueueModule],
    providers: [BlockchainListenerService],
    exports: [BlockchainListenerService],
})
export class BlockchainModule {}
