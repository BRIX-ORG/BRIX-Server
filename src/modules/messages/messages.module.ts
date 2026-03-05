import { Module } from '@nestjs/common';
import { ConversationsController, MessagesController } from './controllers';
import { ConversationRepository, MessageRepository } from './infrastructure';
import {
    SendMessageService,
    GetMessagesService,
    UpdateMessageService,
    ReactMessageService,
    ReadMessagesService,
    GetUnreadCountService,
    GetConversationsService,
    GetConversationMediaService,
    GetConversationFilesService,
    DeleteMessageService,
    DeleteConversationService,
    GetConversationUnreadCountService,
    GetConversationByIdService,
    GetConversationByPartnerService,
} from './application';
import { ConversationMemberGuard } from './guards';
import { UsersModule } from '@users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [ConversationsController, MessagesController],
    providers: [
        // Infrastructure
        ConversationRepository,
        MessageRepository,
        // Application Services
        SendMessageService,
        GetMessagesService,
        UpdateMessageService,
        ReactMessageService,
        ReadMessagesService,
        GetUnreadCountService,
        GetConversationsService,
        GetConversationMediaService,
        GetConversationFilesService,
        DeleteMessageService,
        DeleteConversationService,
        GetConversationUnreadCountService,
        GetConversationByIdService,
        GetConversationByPartnerService,
        ConversationMemberGuard,
    ],
    exports: [ConversationRepository, MessageRepository, DeleteConversationService],
})
export class MessagesModule {}
