import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class GetRealtimeBricksQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by on chain status',
        enum: ['pending', 'ipfs_uploaded', 'onchain', 'failed'],
    })
    @IsOptional()
    @IsIn(['pending', 'ipfs_uploaded', 'onchain', 'failed'])
    onChainStatus?: string;

    @ApiPropertyOptional({ default: 20, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @ApiPropertyOptional({ default: 0, minimum: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
}
