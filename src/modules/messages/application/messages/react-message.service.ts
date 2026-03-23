import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatGateway } from '@/socket';
import { MessageRepository, ConversationRepository } from '@messages/infrastructure';
import { MessageReactions } from '@messages/domain';

@Injectable()
export class ReactMessageService {
    constructor(
        private readonly messageRepo: MessageRepository,
        private readonly conversationRepo: ConversationRepository,
        private readonly chatGateway: ChatGateway,
    ) {}

    /**
     * Toggle a reaction on a message. If the user already reacted with this emoji,
     * the reaction is removed. Otherwise, it is added.
     */
    async execute(messageId: string, userId: string, emoji: string) {
        const message = await this.messageRepo.findById(messageId);
        if (!message || message.deletedAt) {
            throw new NotFoundException('Message not found');
        }

        const isParticipant = await this.conversationRepo.isParticipant(
            message.conversationId,
            userId,
        );
        if (!isParticipant) {
            throw new ForbiddenException('You are not a participant in this conversation');
        }

        const reactions: MessageReactions = (message.reactions as MessageReactions) || {};

        if (!reactions[emoji]) {
            reactions[emoji] = [];
        }

        const index = reactions[emoji].indexOf(userId);
        if (index > -1) {
            // Remove reaction
            reactions[emoji].splice(index, 1);
            if (reactions[emoji].length === 0) {
                delete reactions[emoji];
            }
        } else {
            // Add reaction
            reactions[emoji].push(userId);
        }

        const updatedReactions = Object.keys(reactions).length > 0 ? reactions : null;
        await this.messageRepo.updateReactions(messageId, updatedReactions);

        this.chatGateway.emitMessageReaction(message.conversationId, messageId, updatedReactions);

        return { messageId, reactions: updatedReactions };
    }
}
