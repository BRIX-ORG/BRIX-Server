export interface DistributeIpfsJobData {
    userId: string;
    brickId: string;
    txHash: string;
}

export interface MintSuccessJobData {
    ipfsCid: string;
    txHash: string;
    onChainId: number;
}

export interface DonateJobData {
    onChainBrickId: number;
    donorAddress: string;
    amount: string; // wei string
    artistAmount: string;
    platformAmount: string;
    txHash: string;
}
