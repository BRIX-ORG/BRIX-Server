import { Injectable } from '@nestjs/common';
import { MessageRepository } from '@messages/infrastructure';

@Injectable()
export class GetMessagesService {
    constructor(private readonly messageRepo: MessageRepository) {}

    async execute(conversationId: string, limit: number = 30, offset: number = 0) {
        return this.messageRepo.findByConversationId(conversationId, limit, offset);
    }
}
