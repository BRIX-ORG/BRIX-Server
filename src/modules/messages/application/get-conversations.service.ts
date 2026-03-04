import { Injectable } from '@nestjs/common';
import { ConversationRepository } from '@messages/infrastructure';
import { MessageRepository } from '@messages/infrastructure';
import { ConversationResponseDto, ConversationPartnerDto } from '@messages/dto';
import { MessageResponseDto } from '@messages/dto';

@Injectable()
export class GetConversationsService {
    constructor(
        private readonly conversationRepo: ConversationRepository,
        private readonly messageRepo: MessageRepository,
    ) {}

    async execute(userId: string, limit: number = 20, offset: number = 0) {
        const { data: conversations, total } = await this.conversationRepo.findByUserId(
            userId,
            limit,
            offset,
        );

        const result: ConversationResponseDto[] = await Promise.all(
            conversations.map(async (conv) => {
                // Determine partner
                const partner = conv.user1.id === userId ? conv.user2 : conv.user1;

                // Unread count
                const unreadCount = await this.messageRepo.countUnreadByConversation(
                    conv.id,
                    userId,
                );

                // Last message
                const lastMsg = conv.messages[0] || null;

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

                dto.lastMessage = lastMsg ? MessageResponseDto.fromEntity(lastMsg) : null;
                dto.unreadCount = unreadCount;
                dto.createdAt = conv.createdAt;
                dto.updatedAt = conv.updatedAt;

                return dto;
            }),
        );

        return { data: result, total, limit, offset };
    }
}
