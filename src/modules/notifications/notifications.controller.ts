import {
    Controller,
    Get,
    Put,
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
    GetUnreadNotificationCountService,
    ReadNotificationService,
    ReadAllNotificationsService,
    DeleteNotificationService,
} from '@notifications/application';
import { PaginatedNotificationsDto, UnreadCountDto } from '@notifications/dto';
import { PaginationQueryDto } from '@follows/dto/pagination-query.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
    constructor(
        private readonly getNotificationsService: GetNotificationsService,
        private readonly getUnreadCountService: GetUnreadNotificationCountService,
        private readonly readNotificationService: ReadNotificationService,
        private readonly readAllNotificationsService: ReadAllNotificationsService,
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

    @Get('unread-count')
    @ApiOperation({ summary: 'Get count of unread notifications' })
    @ApiResponse({ status: 200, type: UnreadCountDto })
    async getUnreadCount(@CurrentUser() user: UserEntity): Promise<UnreadCountDto> {
        const count = await this.getUnreadCountService.execute(user.id);
        return { count };
    }

    @Put(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark a notification as read' })
    @ApiResponse({ status: 200, description: 'Successfully marked as read' })
    async markAsRead(@CurrentUser() user: UserEntity, @Param('id') id: string) {
        return this.readNotificationService.execute(id, user.id);
    }

    @Put('read-all')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read' })
    async markAllAsRead(@CurrentUser() user: UserEntity) {
        return this.readAllNotificationsService.execute(user.id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete notification' })
    @ApiResponse({ status: 204, description: 'Successfully deleted' })
    async delete(@CurrentUser() user: UserEntity, @Param('id') id: string) {
        await this.deleteNotificationService.execute(id, user.id);
    }
}
