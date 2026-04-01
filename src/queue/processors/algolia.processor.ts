import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AlgoliaService } from '@/algolia';
import { SyncUserJobData, SyncBrickJobData } from '@/queue/types';

@Processor('algolia', {
    concurrency: 5,
})
export class AlgoliaProcessor extends WorkerHost {
    private readonly logger = new Logger(AlgoliaProcessor.name);

    constructor(private readonly algoliaService: AlgoliaService) {
        super();
    }

    async process(job: Job<SyncUserJobData | SyncBrickJobData>): Promise<void> {
        try {
            switch (job.name) {
                case 'sync-user': {
                    const { userId } = job.data as SyncUserJobData;
                    await this.algoliaService.syncUser(userId);
                    break;
                }
                case 'sync-brick': {
                    const { brickId } = job.data as SyncBrickJobData;
                    await this.algoliaService.syncBrick(brickId);
                    break;
                }
                case 'remove-user': {
                    const { userId } = job.data as SyncUserJobData;
                    await this.algoliaService.removeUser(userId);
                    break;
                }
                case 'remove-brick': {
                    const { brickId } = job.data as SyncBrickJobData;
                    await this.algoliaService.removeBrick(brickId);
                    break;
                }
                default:
                    this.logger.warn(`Unknown job name: ${job.name}`);
            }
        } catch (error: unknown) {
            this.logger.error(
                `Failed to process algolia job ${job.name}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error; // Let BullMQ handle retries
        }
    }
}
