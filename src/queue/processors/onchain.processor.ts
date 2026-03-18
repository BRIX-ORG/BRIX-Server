import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DistributeIpfsJobData, MintSuccessJobData } from '@/queue/types';
import { DistributeIpfsService, MintSuccessService } from '@/modules/onchain';

@Processor('onchain')
export class OnchainProcessor extends WorkerHost {
    private readonly logger = new Logger(OnchainProcessor.name);

    constructor(
        private readonly distributeIpfsService: DistributeIpfsService,
        private readonly mintSuccessService: MintSuccessService,
    ) {
        super();
    }

    async process(job: Job<DistributeIpfsJobData | MintSuccessJobData>): Promise<void> {
        try {
            switch (job.name) {
                case 'process-distribute-ipfs': {
                    const data = job.data as DistributeIpfsJobData;
                    await this.distributeIpfsService.execute(data);
                    break;
                }
                case 'process-mint-success': {
                    const data = job.data as MintSuccessJobData;
                    await this.mintSuccessService.execute(data);
                    break;
                }
                default:
                    this.logger.warn(`Unknown job name: ${job.name}`);
            }
        } catch (error: unknown) {
            this.logger.error(
                `Failed to process onchain job ${job.name}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error; // Let BullMQ handle retries
        }
    }
}
