import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@notifications/infrastructure';

@Injectable()
export class GetUnreadNotificationCountService {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    async execute(recipientId: string): Promise<number> {
        return this.notificationRepository.countUnread(recipientId);
    }
}
