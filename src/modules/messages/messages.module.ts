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
} from './application';

@Module({
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
    ],
    exports: [ConversationRepository, MessageRepository],
})
export class MessagesModule {}
