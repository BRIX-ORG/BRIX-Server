import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from '@messages/infrastructure';

@Injectable()
export class DeleteConversationService {
    constructor(private readonly conversationRepo: ConversationRepository) {}

    async execute(id: string, userId: string): Promise<void> {
        const result = await this.conversationRepo.softDelete(id, userId);
        if (!result) {
            throw new NotFoundException(`Conversation ${id} not found`);
        }
    }
}
