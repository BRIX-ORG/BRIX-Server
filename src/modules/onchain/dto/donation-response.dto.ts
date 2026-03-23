import { ApiProperty } from '@nestjs/swagger';

export class DonationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    brickId: string;

    @ApiProperty()
    fromAddress: string;

    @ApiProperty({ description: 'Amount in MATIC' })
    amount: string;

    @ApiProperty()
    txHash: string;

    @ApiProperty()
    createdAt: Date;
}
