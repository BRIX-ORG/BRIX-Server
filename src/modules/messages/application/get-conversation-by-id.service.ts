import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationRepository, MessageRepository } from '@messages/infrastructure';
import { ConversationResponseDto, ConversationPartnerDto, MessageResponseDto } from '@messages/dto';

@Injectable()
export class GetConversationByIdService {
    constructor(
        private readonly conversationRepo: ConversationRepository,
        private readonly messageRepo: MessageRepository,
    ) {}

    async execute(id: string, userId: string): Promise<ConversationResponseDto> {
        const conv = await this.conversationRepo.findById(id);

        if (!conv) {
            throw new NotFoundException(`Conversation ${id} not found`);
        }

        // Determine partner
        const partner = conv.user1Id === userId ? conv.user2 : conv.user1;

        // Get unread count
        const unreadCount = await this.messageRepo.countUnreadByConversation(id, userId);

        // Get last message (optional but usually helpful for detail)
        // Manual query for last message since findById doesn't include it by default
        const lastMsgResult = await this.prismaSelectLastMessage(id);

        const dto = new ConversationResponseDto();
        dto.id = conv.id;

        const partnerDto = new ConversationPartnerDto();
        partnerDto.id = partner.id;
        partnerDto.username = partner.username;
        partnerDto.fullName = partner.fullName;
        partnerDto.avatar = partner.avatar;
        partnerDto.gender = partner.gender;
        partnerDto.isOnline = partner.isOnline;
        partnerDto.lastSeenAt = partner.lastSeenAt;
        dto.partner = partnerDto;

        dto.lastMessage = lastMsgResult ? MessageResponseDto.fromEntity(lastMsgResult) : null;
        dto.unreadCount = unreadCount;
        dto.createdAt = conv.createdAt;
        dto.updatedAt = conv.updatedAt;

        return dto;
    }

    private async prismaSelectLastMessage(conversationId: string) {
        // We can reach out to messageRepo if it has a way, or just use a simple query
        // For now, let's use messageRepo if it has findByConversationId with limit 1
        const { data } = await this.messageRepo.findByConversationId(conversationId, 1, 0);
        return data[0] || null;
    }
}
