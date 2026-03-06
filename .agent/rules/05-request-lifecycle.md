# Request Lifecycle: Guards, Interceptors & Decorators

The BRIX Server standardizes the handling of requests through a strict pipeline.

## Standard Pipeline

`HTTP Request → Logger → Throttler → Auth Guard → Controller → Service → Repository → Response Interceptor → Client`

## Auth & Identity

- **Guards** (from `@/common`):
    - `@UseGuards(JwtAuthGuard)`: Requires valid JWT (401 if missing/invalid).
    - `@UseGuards(OptionalJwtAuthGuard)`: Attaches user if token present, but allows anonymous access.
- **Decorators**:
    - `@CurrentUser()`: Extracts the `UserEntity` from the request object.

## Response Formatting

All HTTP responses are automatically wrapped by the `ResponseInterceptor`:

```json
{
  "message": "OK",
  "code": 200,
  "data": { ... }
}
```

**Controllers must return raw data**; do not manually wrap objects in a "data" property.

## Guard + Decorator Pair Pattern

To avoid redundant database lookups:

1.  A Guard validates a resource (e.g., checks if user belongs to a chat room) and attaches the resource to `req`.
2.  A Parameter Decorator extracts that resource from `req`.

Example:

```ts
@UseGuards(JwtAuthGuard, ConversationMemberGuard)
async getMessages(@GetConversation() conversation: ConversationEntity) { ... }
```

Ref: `src/modules/messages/guards/` and `src/modules/messages/decorators/`.

## Exception Handling

Global filters (`HttpExceptionFilter`, `AllExceptionsFilter`) handle all errors. Use standard NestJS `HttpException` subclasses (e.g., `NotFoundException`, `ForbiddenException`).
