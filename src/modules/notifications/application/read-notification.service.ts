import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@notifications/infrastructure';

@Injectable()
export class ReadNotificationService {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    async execute(id: string, recipientId: string) {
        return this.notificationRepository.markAsRead(id, recipientId);
    }
}
