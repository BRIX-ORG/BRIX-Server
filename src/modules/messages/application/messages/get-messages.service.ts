import { Injectable } from '@nestjs/common';
import { MessageRepository } from '@messages/infrastructure';
import { Conversation } from '@messages/domain';

@Injectable()
export class GetMessagesService {
    constructor(private readonly messageRepo: MessageRepository) {}

    async execute(
        conversation: Conversation,
        userId: string,
        limit: number = 30,
        offset: number = 0,
    ) {
        // Determine which hiddenAt to use based on which user is requesting
        const hiddenAt =
            conversation.user1Id === userId
                ? conversation.user1HiddenAt
                : conversation.user2HiddenAt;

        return this.messageRepo.findByConversationId(
            conversation.id,
            limit,
            offset,
            hiddenAt || undefined,
        );
    }
}
