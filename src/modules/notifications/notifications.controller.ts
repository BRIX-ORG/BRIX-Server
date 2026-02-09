import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common';
import { UserEntity } from '@users/domain';
import {
    GetNotificationsService,
    ReadNotificationService,
    DeleteNotificationService,
} from '@notifications/application';
import { PaginatedNotificationsDto } from '@notifications/dto';
import { PaginationQueryDto } from '@follows/dto/pagination-query.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(
        private readonly getNotificationsService: GetNotificationsService,
        private readonly readNotificationService: ReadNotificationService,
        private readonly deleteNotificationService: DeleteNotificationService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all notifications with pagination' })
    @ApiResponse({ status: 200, type: PaginatedNotificationsDto })
    async findAll(
        @CurrentUser() user: UserEntity,
        @Query() query: PaginationQueryDto,
    ): Promise<PaginatedNotificationsDto> {
        const limit = query.limit || 20;
        const offset = query.offset || 0;
        const { notifications, total } = await this.getNotificationsService.execute(
            user.id,
            limit,
            offset,
        );

        return {
            data: notifications,
            total,
            limit,
            offset,
        };
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'Successfully marked as read' })
    async markAsRead(@CurrentUser() user: UserEntity, @Param('id') id: string) {
        return await this.readNotificationService.execute(id, user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete notification' })
    @ApiResponse({ status: 204, description: 'Successfully deleted' })
    async delete(@CurrentUser() user: UserEntity, @Param('id') id: string) {
        await this.deleteNotificationService.execute(id, user.id);
    }
}
