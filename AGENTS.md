# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Overview

NestJS monolith for BRIX social/media platform. Bricks are media content (images/3D/video) with location verification. Uses DDD/Clean Architecture layering in `src/modules/`.

## Commands

- **Package Manager**: Use **pnpm only** (npm and yarn are prohibited)
- `pnpm start:dev` - Hot reload development
- `pnpm build` - Build for production
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:e2e` - Run e2e tests
- `pnpm lint` - Lint and fix code
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check formatting without fixing
- `pnpm prisma:migrate` - Apply database migrations (never use prisma:push)
- `pnpm prisma:generate` - Regenerate Prisma client
- `pnpm prisma:studio` - Open database GUI
- `pnpm prisma:reset` - Wipe and replay migrations
- `pnpm reindex:algolia` - Reindex Algolia search

**Infrastructure**: `docker-compose up -d` for local DB (PostgreSQL), Redis, and MinIO.

## Architecture

### Directory Structure

| Folder             | Purpose                                                                         |
| :----------------- | :------------------------------------------------------------------------------ |
| `src/modules/`     | Feature modules (users, auth, bricks, messages, albums, follows, notifications) |
| `src/common/`      | Global guards, decorators, interceptors, filters, DTOs, strategies              |
| `src/prisma/`      | Prisma service and client                                                       |
| `src/redis/`       | Redis service                                                                   |
| `src/email/`       | Email service (SendGrid + MJML templates)                                       |
| `src/socket/`      | Socket.IO service                                                               |
| `src/queue/`       | BullMQ queues (email, notifications, photo-upload)                              |
| `src/cron/`        | Scheduled jobs                                                                  |
| `src/minio/`       | MinIO file storage (original files)                                             |
| `src/cloudinary/`  | Cloudinary service (watermarked/optimized delivery)                             |
| `src/algolia/`     | Algolia search                                                                  |
| `src/firebase/`    | Firebase Admin SDK                                                              |
| `src/location-iq/` | Location services                                                               |

### Feature Module Layout (DDD)

Each module in `src/modules/{name}/` follows this structure:

1. **domain/** - Interfaces and types (zero framework/DB dependencies)
2. **dto/** - Request validation and response shapes
3. **application/** - One service class per use case (e.g., `SendMessageService`, `GetConversationsService`)
4. **infrastructure/** - Repositories (the only place that touches `PrismaService`)
5. **controllers/** - Entry points
6. **guards/** - Resource access guards
7. **decorators/** - Custom decorators

### Path Aliases

Use path aliases for all imports. Never use relative paths across modules.

- `@modules/*` - Modules barrel exports
- `@users/*` - Users module
- `@auth/*` - Auth module
- `@bricks/*` - Bricks module
- `@messages/*` - Messages module
- `@albums/*` - Albums module
- `@follows/*` - Follows module
- `@notifications/*` - Notifications module
- `@prisma/*` - Prisma
- `@redis/*` - Redis
- `@queue/*` - Queues
- `@socket/*` - Socket.IO
- `@email/*` - Email
- `@minio/*` - MinIO
- `@cloudinary/*` - Cloudinary
- `@common/*` - Common utilities
- `@config/*` - Configuration
- `@cron/*` - Cron jobs

## Key Patterns

### Response Format

All responses are automatically wrapped via `ResponseInterceptor`: `{ message, code, data }`.

### Authentication

- `JwtAuthGuard` - Requires token, returns 401 if missing
- `OptionalJwtAuthGuard` - Attaches user if token present, allows anonymous
- `@CurrentUser()` decorator extracts authenticated user from request

### Guard + Decorator Pattern

For optimized DB calls, guards attach validated resources to the request object, and decorators extract them in controllers:

```typescript
// Guard attaches conversation
req.conversation = conversation;

// Decorator extracts it
@GetConversation() conversation: Conversation
```

Reference: `src/modules/messages/guards/` and `src/modules/messages/decorators/`

### Storage Strategy

Two-stage upload process:

1. **MinIO** - Original file storage (source of truth)
2. **Cloudinary** - Watermarked/optimized versions for public delivery

Upload flow: MinIO → BullMQ job → Process/Watermark → Cloudinary

### Real-time

Socket.IO with `/chat` namespace for messaging.

### Queues

BullMQ for async processing:

- Email notifications
- Push notifications
- Brick description generation
- Photo upload processing

### Logging & Error Handling

- Every service must have a class-level `Logger`
- Use standard NestJS `HttpException` subclasses (e.g., `NotFoundException`)
- Never silent errors - always log at error level with context
- Fire-and-forget tasks use `.catch()` instead of `await`:
    ```typescript
    this.queue.sendMail(user).catch((e) => this.logger.error('Mail failed', e));
    ```
- Use `Promise.all()` for independent async operations

### Redis Naming

Use `prefix:type:identifier` format (e.g., `user:session:abc123`).

## Swagger API Documentation

All endpoints must include high-quality Swagger decorators:

- `@ApiOperation` with description
- `@ApiResponse` with realistic examples
- `@ApiProperty` with examples on all DTO fields

## Code Style

- **No emojis** in source code
- Conventional commits: `<type>(<scope>): <subject>` (types: feat, fix, refactor, perf, style, test, docs, build, ci, chore)
- Use `src/modules/messages/` as the reference implementation for new features

## Before Non-Trivial Changes

1. Run `pnpm lint`
2. Run `pnpm build`
3. Run `pnpm test`
