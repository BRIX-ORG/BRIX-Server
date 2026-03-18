import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Provider } from 'ethers';
import { QueueService } from '@/queue';

@Injectable()
export class BlockchainListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BlockchainListenerService.name);
    private provider: Provider | null = null;
    private contract: Contract | null = null;

    private readonly ABI = [
        'event PaidForIPFS(address indexed user, string brickId)',
        'event BrickCreated(uint256 id, address indexed creator, string ipfsCid)',
        'event Donated(uint256 brickId, address indexed donor, uint256 amount)',
    ];

    constructor(
        private readonly configService: ConfigService,
        private readonly queueService: QueueService,
    ) {}

    onModuleInit() {
        const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL');
        const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

        if (!rpcUrl || !contractAddress || !ethers.isAddress(contractAddress)) {
            this.logger.warn(
                'POLYGON_RPC_URL or valid CONTRACT_ADDRESS not found. Onchain event listening disabled.',
            );
            return;
        }

        try {
            if (rpcUrl.startsWith('wss://')) {
                this.provider = new ethers.WebSocketProvider(rpcUrl);
            } else {
                this.provider = new ethers.JsonRpcProvider(rpcUrl);
            }

            this.contract = new ethers.Contract(contractAddress, this.ABI, this.provider);
            this.logger.log(`Listening to smart contract events at ${contractAddress}`);

            // 1. Listen for PaidForIPFS (Distribute Flow)
            void this.contract.on(
                'PaidForIPFS',
                (user: string, brickId: string, event: ethers.EventLog) => {
                    this.logger.log(
                        `Received PaidForIPFS event: user=${user}, brickId=${brickId}, txHash=${event.transactionHash}`,
                    );
                    void this.queueService
                        .addDistributeIpfsJob(user, brickId, event.transactionHash)
                        .catch((err) => {
                            this.logger.error(
                                `Failed to add Distribute IPFS job: ${err instanceof Error ? err.message : String(err)}`,
                            );
                        });
                },
            );

            // 2. Listen for BrickCreated (Mint Success Flow)
            void this.contract.on(
                'BrickCreated',
                (id: bigint, creator: string, ipfsCid: string, event: ethers.EventLog) => {
                    this.logger.log(
                        `Received BrickCreated event: id=${id}, creator=${creator}, ipfsCid=${ipfsCid}, txHash=${event.transactionHash}`,
                    );
                    void this.queueService
                        .addMintSuccessJob(ipfsCid, event.transactionHash)
                        .catch((err) => {
                            this.logger.error(
                                `Failed to add Mint Success job: ${err instanceof Error ? err.message : String(err)}`,
                            );
                        });
                },
            );

            // Note: Donated event can be supported similarly in the future
        } catch (error) {
            this.logger.error(
                `Failed to initialize BlockchainListener: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    async onModuleDestroy() {
        if (this.contract) {
            void this.contract.removeAllListeners();
        }
        if (this.provider && this.provider instanceof ethers.WebSocketProvider) {
            await this.provider.destroy();
        }
    }
}
