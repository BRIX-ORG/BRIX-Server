import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@notifications/infrastructure';

@Injectable()
export class ReadAllNotificationsService {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    async execute(recipientId: string) {
        return this.notificationRepository.markAllAsRead(recipientId);
    }
}
