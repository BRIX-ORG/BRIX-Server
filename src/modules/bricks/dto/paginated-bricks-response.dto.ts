import { ApiProperty } from '@nestjs/swagger';
import { BrickResponseDto } from './brick-response.dto';

export class PaginatedBricksResponseDto {
    @ApiProperty({ type: [BrickResponseDto] })
    data: BrickResponseDto[];

    @ApiProperty() total: number;
    @ApiProperty() limit: number;
    @ApiProperty() offset: number;
}
