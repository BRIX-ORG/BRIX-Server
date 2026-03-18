import { ApiProperty } from '@nestjs/swagger';

export interface WalletEntityProps {
    id: string;
    address: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export class WalletEntity {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'The unique identifier of the wallet',
    })
    readonly id: string;

    @ApiProperty({
        example: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'The blockchain address',
    })
    readonly address: string;

    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'The ID of the user who owns this wallet',
    })
    readonly userId: string;

    @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'When the wallet was linked' })
    readonly createdAt: Date;

    @ApiProperty({
        example: '2024-01-01T00:00:00Z',
        description: 'When the wallet was last updated',
    })
    readonly updatedAt: Date;

    constructor(props: WalletEntityProps) {
        this.id = props.id;
        this.address = props.address;
        this.userId = props.userId;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
}
