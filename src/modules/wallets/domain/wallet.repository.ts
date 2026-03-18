import { WalletEntity } from './wallet.entity';

export abstract class WalletRepository {
    abstract create(data: { address: string; userId: string }): Promise<WalletEntity>;
    abstract findById(id: string): Promise<WalletEntity | null>;
    abstract findByAddress(address: string): Promise<WalletEntity | null>;
    abstract findManyByUserId(userId: string): Promise<WalletEntity[]>;
    abstract delete(id: string): Promise<void>;
}
