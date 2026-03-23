import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Provider } from 'ethers';
import { QueueService } from '@/queue';
import { OnchainRepository } from '@/modules/onchain/infrastructure';

@Injectable()
export class BlockchainListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BlockchainListenerService.name);
    private provider: Provider | null = null;
    private contract: Contract | null = null;

    private readonly ABI = [
        'event PaidForIPFS(address indexed user, bytes32 brickId)',
        'event BrickCreated(uint256 indexed id, address indexed creator, string ipfsCid)',
        'event Donated(uint256 indexed brickId, address indexed donor, uint256 amount, uint256 artistAmount, uint256 platformAmount)',
        'event FeesWithdrawn(address owner, uint256 amount)',
        'event DonationWithdrawn(address account, uint256 amount)',
    ];

    constructor(
        private readonly configService: ConfigService,
        private readonly queueService: QueueService,
        private readonly onchainRepository: OnchainRepository,
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
                (user: string, brickId: string, event: ethers.ContractEventPayload) => {
                    const parsedBrickId = this.bytes32ToUuid(brickId);
                    this.logger.log(
                        `Received PaidForIPFS event: user=${user}, brickId=${parsedBrickId} (raw: ${brickId}), txHash=${event.log.transactionHash}`,
                    );

                    // Optimistically mark as pending to prevent duplicate processing on frontend
                    this.onchainRepository.updateIpfsPending(parsedBrickId).catch((err) => {
                        this.logger.warn(
                            `Failed to update status to pending for ${parsedBrickId}: ${err instanceof Error ? err.message : String(err)}`,
                        );
                    });

                    void this.queueService
                        .addDistributeIpfsJob(user, parsedBrickId, event.log.transactionHash)
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
                (
                    id: bigint,
                    creator: string,
                    ipfsCid: string,
                    event: ethers.ContractEventPayload,
                ) => {
                    this.logger.log(
                        `Received BrickCreated event: id=${id}, creator=${creator}, ipfsCid=${ipfsCid}, txHash=${event.log.transactionHash}`,
                    );
                    void this.queueService
                        .addMintSuccessJob(ipfsCid, event.log.transactionHash, Number(id))
                        .catch((err) => {
                            this.logger.error(
                                `Failed to add Mint Success job: ${err instanceof Error ? err.message : String(err)}`,
                            );
                        });
                },
            );

            // 3. Listen for Donated (Donation Flow)
            void this.contract.on(
                'Donated',
                (
                    brickId: bigint,
                    donorAddress: string,
                    amount: bigint,
                    artistAmount: bigint,
                    platformAmount: bigint,
                    event: ethers.ContractEventPayload,
                ) => {
                    this.logger.log(
                        `Received Donated event: brickId=${brickId}, donor=${donorAddress}, amount=${amount}, txHash=${event.log.transactionHash}`,
                    );
                    void this.queueService
                        .addDonateJob(
                            Number(brickId),
                            donorAddress,
                            amount.toString(),
                            artistAmount.toString(),
                            platformAmount.toString(),
                            event.log.transactionHash,
                        )
                        .catch((err) => {
                            this.logger.error(
                                `Failed to add Donate job: ${err instanceof Error ? err.message : String(err)}`,
                            );
                        });
                },
            );
        } catch (error) {
            this.logger.error(
                `Failed to initialize BlockchainListener: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Converts a bytes32 hex value (emitted by the smart contract) back to a UUID string.
     * The Brick UUID (16 bytes) is stored as the first 16 bytes of a bytes32.
     * e.g. "0xc9eab6aa34c5bfc29b68c04e7a09c517000...0" → "c9eab6aa-34c5-bfc2-9b68-c04e7a09c517"
     */
    private bytes32ToUuid(bytes32: string): string {
        // Strip 0x prefix and take first 32 hex chars (= 16 bytes = UUID)
        const hex = bytes32.startsWith('0x') ? bytes32.slice(2) : bytes32;
        const uuidHex = hex.slice(0, 32);
        return [
            uuidHex.slice(0, 8),
            uuidHex.slice(8, 12),
            uuidHex.slice(12, 16),
            uuidHex.slice(16, 20),
            uuidHex.slice(20, 32),
        ].join('-');
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
