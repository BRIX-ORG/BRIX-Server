import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@notifications/infrastructure';

@Injectable()
export class GetNotificationsService {
    constructor(private readonly notificationRepository: NotificationRepository) {}

    async execute(recipientId: string, limit?: number, offset: number = 0) {
        return this.notificationRepository.findMany(recipientId, limit, offset);
    }
}
