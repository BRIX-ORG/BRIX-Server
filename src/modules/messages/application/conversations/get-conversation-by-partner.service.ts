import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationRepository, MessageRepository } from '@messages/infrastructure';
import { ConversationResponseDto, ConversationPartnerDto, MessageResponseDto } from '@messages/dto';
import { UserRepository } from '@users/infrastructure';
import { type Conversation } from '@messages/domain';

@Injectable()
export class GetConversationByPartnerService {
    constructor(
        private readonly conversationRepo: ConversationRepository,
        private readonly messageRepo: MessageRepository,
        private readonly userRepo: UserRepository,
    ) {}

    async execute(userId: string, partnerId: string): Promise<ConversationResponseDto> {
        // Find conversation
        const conv = (await this.conversationRepo.findByUsers(userId, partnerId)) as Conversation;

        if (!conv) {
            throw new NotFoundException(`Conversation with user ${partnerId} not found`);
        }

        // Get partner user info via UserRepository
        const partnerUser = await this.userRepo.findById(partnerId);

        if (!partnerUser) {
            throw new NotFoundException(`User with ID ${partnerId} not found`);
        }

        // Get unread count
        const unreadCount = await this.messageRepo.countUnreadByConversation(conv.id, userId);

        // Get last message
        const { data: lastMsgs } = await this.messageRepo.findByConversationId(conv.id, 1, 0);
        const lastMsg = lastMsgs[0] || null;

        // Build Response DTO
        const dto = new ConversationResponseDto();
        dto.id = conv.id;

        const partnerDto = new ConversationPartnerDto();
        partnerDto.id = partnerUser.id;
        partnerDto.username = partnerUser.username;
        partnerDto.fullName = partnerUser.fullName;
        partnerDto.avatar = partnerUser.avatar;
        partnerDto.gender = partnerUser.gender;
        partnerDto.isOnline = partnerUser.isOnline;
        partnerDto.lastSeenAt = partnerUser.lastSeenAt;
        dto.partner = partnerDto;

        dto.lastMessage = lastMsg ? MessageResponseDto.fromEntity(lastMsg) : null;
        dto.unreadCount = unreadCount;
        dto.createdAt = conv.createdAt;
        dto.updatedAt = conv.updatedAt;

        return dto;
    }
}
