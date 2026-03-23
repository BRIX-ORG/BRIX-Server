import { ApiProperty } from '@nestjs/swagger';
import { Brick, User, Donation } from '@prisma/client';
import { BrickResponseDto } from './brick-response.dto';

export class RealtimeBrickResponseDto extends BrickResponseDto {
    @ApiProperty({ description: 'Total donations revenue for this brick', type: String })
    totalRevenue: string;

    static fromEntityWithRevenue(
        brick: Brick & {
            metadata?: any;
            user?: Pick<User, 'id' | 'username' | 'fullName' | 'avatar' | 'gender'> | null;
            donations?: Pick<Donation, 'amount'>[];
        },
    ): RealtimeBrickResponseDto {
        const dto = new RealtimeBrickResponseDto();
        const base = BrickResponseDto.fromEntity(brick);
        Object.assign(dto, base);

        // Calculate total revenue from donations
        let total = 0;
        if (brick.donations && brick.donations.length > 0) {
            total = brick.donations.reduce((acc, curr) => {
                const amount = Number(curr.amount);
                return acc + (isNaN(amount) ? 0 : amount);
            }, 0);
        }

        dto.totalRevenue = total.toString();
        return dto;
    }
}
