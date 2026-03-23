import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { DonationResponseDto } from './donation-response.dto';

export class OnchainPaginationQueryDto {
    @ApiProperty({ default: 20, minimum: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @ApiProperty({ default: 0, minimum: 0, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
}

export class OnchainActivityResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    brickId: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    txHash: string;

    @ApiProperty({ required: false, type: String })
    gasUsed: string | null;

    @ApiProperty()
    status: string;

    @ApiProperty()
    createdAt: Date;
}

export class PaginatedOnchainActivityResponseDto {
    @ApiProperty({ type: [OnchainActivityResponseDto] })
    data: OnchainActivityResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    offset: number;
}

export class PaginatedDonationResponseDto {
    @ApiProperty({ type: [DonationResponseDto] })
    data: DonationResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    offset: number;
}
