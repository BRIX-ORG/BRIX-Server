import { Injectable } from '@nestjs/common';
import { MessageRepository } from '@messages/infrastructure';

@Injectable()
export class GetUnreadCountService {
    constructor(private readonly messageRepo: MessageRepository) {}

    async execute(userId: string) {
        const totalUnread = await this.messageRepo.countUnread(userId);
        return { totalUnread };
    }
}
