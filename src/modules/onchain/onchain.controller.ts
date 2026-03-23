import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
    OnchainPaginationQueryDto,
    PaginatedOnchainActivityResponseDto,
    PaginatedDonationResponseDto,
} from './dto/onchain-profile.dto';
import { GetUserOnchainActivitiesService } from './application/get-user-onchain-activities.service';
import { GetUserDonationsService } from './application/get-user-donations.service';

@ApiTags('Onchain Profile')
@Controller('onchain')
export class OnchainController {
    constructor(
        private readonly getUserOnchainActivitiesService: GetUserOnchainActivitiesService,
        private readonly getUserDonationsService: GetUserDonationsService,
    ) {}

    @Get('activities/user/:idOrUsername')
    @ApiOperation({
        summary: 'Get paginated onchain activities of a user',
        description:
            'Returns all onchain activities (MINT, DONATE) related to bricks owned by the specified user (by ID or username).',
    })
    @ApiParam({ name: 'idOrUsername', description: 'User UUID or username' })
    @ApiResponse({
        status: 200,
        description: 'Paginated onchain activities.',
        type: PaginatedOnchainActivityResponseDto,
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async getUserOnchainActivities(
        @Param('idOrUsername') idOrUsername: string,
        @Query() query: OnchainPaginationQueryDto,
    ): Promise<PaginatedOnchainActivityResponseDto> {
        const limitStr = query.limit !== undefined ? Number(query.limit) : 20;
        const offsetStr = query.offset !== undefined ? Number(query.offset) : 0;

        const { data, total, limit, offset } = await this.getUserOnchainActivitiesService.execute(
            idOrUsername,
            limitStr,
            offsetStr,
        );

        return {
            data: data.map((a) => ({
                id: a.id,
                brickId: a.brickId,
                type: a.type,
                txHash: a.txHash,
                gasUsed: a.gasUsed ? a.gasUsed.toString() : null,
                status: a.status,
                createdAt: a.createdAt,
            })),
            total,
            limit,
            offset,
        };
    }

    @Get('donations/user/:idOrUsername')
    @ApiOperation({
        summary: 'Get paginated donations received by a user',
        description:
            'Returns all donations received by all bricks owned by the specified user (by ID or username).',
    })
    @ApiParam({ name: 'idOrUsername', description: 'User UUID or username' })
    @ApiResponse({
        status: 200,
        description: 'Paginated donations.',
        type: PaginatedDonationResponseDto,
    })
    @ApiResponse({ status: 404, description: 'User not found.' })
    async getUserDonations(
        @Param('idOrUsername') idOrUsername: string,
        @Query() query: OnchainPaginationQueryDto,
    ): Promise<PaginatedDonationResponseDto> {
        const limitStr = query.limit !== undefined ? Number(query.limit) : 20;
        const offsetStr = query.offset !== undefined ? Number(query.offset) : 0;

        const { data, total, limit, offset } = await this.getUserDonationsService.execute(
            idOrUsername,
            limitStr,
            offsetStr,
        );

        return {
            data: data.map((d) => ({
                id: d.id,
                brickId: d.brickId,
                fromAddress: d.fromAddress,
                amount: d.amount.toString(),
                txHash: d.txHash,
                createdAt: d.createdAt,
            })),
            total,
            limit,
            offset,
        };
    }
}
