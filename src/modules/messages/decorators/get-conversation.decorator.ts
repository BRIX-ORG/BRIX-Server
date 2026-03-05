import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Conversation } from '@messages/domain';

export const GetConversation = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): Conversation => {
        const request = ctx.switchToHttp().getRequest<Request & { conversation: Conversation }>();
        return request.conversation;
    },
);
