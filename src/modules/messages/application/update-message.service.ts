import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatGateway } from '@/socket/chat.gateway';
import { MessageRepository } from '@messages/infrastructure';
import { MessageResponseDto } from '@messages/dto';

@Injectable()
export class UpdateMessageService {
    constructor(
        private readonly messageRepo: MessageRepository,
        private readonly chatGateway: ChatGateway,
    ) {}

    async execute(messageId: string, userId: string, content: string): Promise<MessageResponseDto> {
        const message = await this.messageRepo.findById(messageId);
        if (!message || message.deletedAt) {
            throw new NotFoundException('Message not found');
        }
        if (message.senderId !== userId) {
            throw new ForbiddenException('You can only edit your own messages');
        }

        const updated = await this.messageRepo.updateContent(messageId, content);
        const responseDto = MessageResponseDto.fromEntity(updated);
        this.chatGateway.emitMessageUpdated(message.conversationId, responseDto);
        return responseDto;
    }
}
