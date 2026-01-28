import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserEntity } from '@users/domain';
import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): UserEntity => {
        const request = ctx.switchToHttp().getRequest<Request>();
        return (request as Request & { user: UserEntity }).user;
    },
);
