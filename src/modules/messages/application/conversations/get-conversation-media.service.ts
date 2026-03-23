import { Injectable } from '@nestjs/common';
import { MessageRepository } from '@messages/infrastructure';
import { MediaItemResponseDto } from '@messages/dto';
import { Conversation } from '@messages/domain';

@Injectable()
export class GetConversationMediaService {
    constructor(private readonly messageRepo: MessageRepository) {}

    /**
     * Get all images in a conversation, paginated.
     */
    async execute(
        conversation: Conversation,
        userId: string,
        limit: number = 20,
        offset: number = 0,
        includeDeleted: boolean = false,
    ) {
        const hiddenAt =
            conversation.user1Id === userId
                ? conversation.user1HiddenAt
                : conversation.user2HiddenAt;

        const { data, total } = await this.messageRepo.findImagesByConversation(
            conversation.id,
            limit,
            offset,
            includeDeleted,
            hiddenAt || undefined,
        );

        const items: MediaItemResponseDto[] = data.map((msg) => {
            const dto = new MediaItemResponseDto();
            dto.messageId = msg.id;
            dto.senderId = msg.senderId;
            dto.createdAt = msg.createdAt;
            dto.data = msg.images;
            return dto;
        });

        return { data: items, total, limit, offset };
    }
}
