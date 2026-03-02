import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard — allows unauthenticated requests to pass through.
 * If a valid JWT is provided, it populates req.user.
 * If no token / invalid token, req.user remains undefined (no exception thrown).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    override canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    // Override handleRequest so it never throws — just returns user or undefined
    override handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
        return user; // ignore err & exception, return undefined if not authenticated
    }
}
