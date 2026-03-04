import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDto {
    @ApiProperty({ description: 'Total unread messages across all conversations' })
    totalUnread: number;
}
