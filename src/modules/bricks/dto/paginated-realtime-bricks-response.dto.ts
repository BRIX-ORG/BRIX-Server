import { ApiProperty } from '@nestjs/swagger';
import { RealtimeBrickResponseDto } from './realtime-brick-response.dto';

export class PaginatedRealtimeBricksResponseDto {
    @ApiProperty({ type: [RealtimeBrickResponseDto] })
    data: RealtimeBrickResponseDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    offset: number;
}
