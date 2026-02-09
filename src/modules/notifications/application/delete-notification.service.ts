import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@notifications/infrastructure';

@Injectable()
export class DeleteNotificationService {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    async execute(id: string, recipientId: string) {
        return this.notificationRepository.delete(id, recipientId);
    }
}
