import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SocketGateway } from '@/socket/socket.gateway';
import { MessageRepository } from '@messages/infrastructure';

@Injectable()
export class DeleteMessageService {
    constructor(
        private readonly messageRepo: MessageRepository,
        private readonly socketGateway: SocketGateway,
    ) {}

    async execute(messageId: string, userId: string) {
        const message = await this.messageRepo.findById(messageId);
        if (!message || message.deletedAt) {
            throw new NotFoundException('Message not found');
        }
        if (message.senderId !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        await this.messageRepo.softDelete(messageId);
        this.socketGateway.emitMessageDeleted(message.conversationId, messageId);
    }
}
