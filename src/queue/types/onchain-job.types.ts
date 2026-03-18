export interface DistributeIpfsJobData {
    userId: string;
    brickId: string;
    txHash: string;
}

export interface MintSuccessJobData {
    ipfsCid: string;
    txHash: string;
}
