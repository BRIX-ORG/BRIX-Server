import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserEntity } from '@users/domain';
import { ConversationRepository } from '@messages/infrastructure';
import { Conversation } from '@messages/domain';

interface RequestWithConversation extends Request {
    user: UserEntity;
    conversation: Conversation;
}

@Injectable()
export class ConversationMemberGuard implements CanActivate {
    constructor(private readonly conversationRepo: ConversationRepository) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithConversation>();
        const user = request.user;
        const userId = user?.id;

        const params = request.params as Record<string, string>;
        const body = request.body as Record<string, any>;

        const conversationId = (params.id ||
            params.conversationId ||
            body.conversationId) as string;

        if (!userId) {
            return false;
        }

        if (!conversationId) {
            return true;
        }

        const conversation = await this.conversationRepo.findById(conversationId);

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const isParticipant = conversation.user1Id === userId || conversation.user2Id === userId;

        if (!isParticipant) {
            throw new ForbiddenException('You are not a member of this conversation');
        }

        request.conversation = conversation;

        return true;
    }
}
