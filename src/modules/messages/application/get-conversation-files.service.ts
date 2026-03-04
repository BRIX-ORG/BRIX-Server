import { Injectable } from '@nestjs/common';
import { MessageRepository } from '@messages/infrastructure';
import { MediaItemResponseDto } from '@messages/dto';

@Injectable()
export class GetConversationFilesService {
    constructor(private readonly messageRepo: MessageRepository) {}

    /**
     * Get all files in a conversation, paginated.
     */
    async execute(conversationId: string, limit: number = 20, offset: number = 0) {
        const { data, total } = await this.messageRepo.findFilesByConversation(
            conversationId,
            limit,
            offset,
        );

        const items: MediaItemResponseDto[] = data.map((msg) => {
            const dto = new MediaItemResponseDto();
            dto.messageId = msg.id;
            dto.senderId = msg.senderId;
            dto.createdAt = msg.createdAt;
            dto.data = msg.file;
            return dto;
        });

        return { data: items, total, limit, offset };
    }
}
