import { Injectable } from '@nestjs/common';
import { MessageRepository } from '@messages/infrastructure';
import { Conversation } from '@messages/domain';

@Injectable()
export class GetConversationUnreadCountService {
    constructor(private readonly messageRepo: MessageRepository) {}

    async execute(conversation: Conversation, userId: string) {
        const hiddenAt =
            conversation.user1Id === userId
                ? conversation.user1HiddenAt
                : conversation.user2HiddenAt;

        const unreadCount = await this.messageRepo.countUnreadByConversation(
            conversation.id,
            userId,
            hiddenAt || undefined,
        );
        return { unreadCount };
    }
}
