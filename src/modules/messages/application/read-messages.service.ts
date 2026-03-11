import { Injectable } from '@nestjs/common';
import { ChatGateway } from '@/socket';
import { MessageRepository } from '@messages/infrastructure';

@Injectable()
export class ReadMessagesService {
    constructor(
        private readonly messageRepo: MessageRepository,
        private readonly chatGateway: ChatGateway,
    ) {}

    /**
     * Mark all unread messages in a conversation as read for the current user.
     */
    async execute(conversationId: string, userId: string) {
        const result = await this.messageRepo.markAsRead(conversationId, userId);
        this.chatGateway.emitMessagesRead(conversationId, userId);
        return { markedAsRead: result.count };
    }
}
