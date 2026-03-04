import { ApiProperty } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';

export class PaginatedMessagesResponseDto {
    @ApiProperty({ type: [MessageResponseDto] })
    data: MessageResponseDto[];

    @ApiProperty() total: number;
    @ApiProperty() limit: number;
    @ApiProperty() offset: number;
}
