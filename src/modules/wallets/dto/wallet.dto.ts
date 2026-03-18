import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { WalletEntity } from '../domain';

export class LinkWalletDto {
    @ApiProperty({ example: '0x1234567890abcdef1234567890abcdef12345678' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address' })
    address: string;

    @ApiProperty({ example: '0xabc...signature' })
    @IsString()
    @IsNotEmpty()
    signature: string;

    @ApiProperty({ example: 'Link wallet: 123456' })
    @IsString()
    @IsNotEmpty()
    message: string;
}

export class WalletResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    address: string;

    @ApiProperty()
    createdAt: Date;

    constructor(id: string, address: string, createdAt: Date) {
        this.id = id;
        this.address = address;
        this.createdAt = createdAt;
    }

    static fromEntity(entity: WalletEntity) {
        return new WalletResponseDto(entity.id, entity.address, entity.createdAt);
    }
}

export class WalletNonceResponseDto {
    @ApiProperty({ example: 'Link wallet: 123456' })
    nonce: string;

    constructor(nonce: string) {
        this.nonce = nonce;
    }
}
