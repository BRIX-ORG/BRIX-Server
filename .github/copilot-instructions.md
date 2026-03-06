# BRIX Server — Copilot Instructions

## Commands

```bash
# Development
pnpm start:dev          # Start with hot reload
pnpm build              # Compile TypeScript via NestJS CLI

# Testing
pnpm test               # Run all unit tests (Jest)
pnpm test:watch         # Watch mode
pnpm test:e2e           # End-to-end tests
# Run a single test file:
pnpm test -- --testPathPattern="src/modules/users/application/find-user.service.spec.ts"

# Linting & Formatting
pnpm lint               # ESLint with auto-fix
pnpm format             # Prettier write
pnpm format:check       # Prettier check (CI)

# Database
pnpm prisma:migrate     # Create + apply migration (dev) — always use this, not prisma:push
pnpm prisma:generate    # Regenerate Prisma Client types
pnpm prisma:studio      # Open DB browser UI
pnpm prisma:reset       # Erase all data and replay migrations

# Infrastructure (Docker)
docker-compose up -d    # Start PostgreSQL, Redis, MinIO
```

> Only `pnpm` is allowed (`preinstall` enforces it).

## Architecture

BRIX Server is a **NestJS monolith** serving a social/media platform where users post "Bricks" (media content: images, 3D/GLTF, video) with location tags.

### Top-level `src/` Structure

```
src/
├── modules/         # Business logic (features): users, auth, bricks, follows, notifications, messages
├── common/          # Shared utilities used globally: guards, decorators, interceptors, filters, middlewares, pipes
├── config/          # Typed configuration factories (appConfig, cloudinaryConfig, etc.)
├── prisma/          # PrismaModule + PrismaService (global DB client)
├── redis/           # RedisModule (global) — shared cache & pub/sub
├── email/           # EmailModule (global) — SendGrid + MJML templates
├── socket/          # SocketModule (global) — Socket.IO gateway for real-time chat
├── firebase/        # FirebaseModule — push notifications via Firebase Admin
├── cloudinary/      # CloudinaryModule — watermarked image delivery
├── minio/           # MinioModule — original file storage (S3-compatible)
├── location-iq/     # LocationIqModule — geocoding/reverse geocoding
├── queue/           # ALL BullMQ processors (email, notifications, brick-description, photo-upload)
└── cron/            # ALL scheduled tasks (CronModule)
```

`queue/` and `cron/` are **centralized intentionally** — all background jobs and scheduled tasks live here so they can be audited in one place rather than scattered across feature modules.

`redis/`, `email/`, and `socket/` are registered as **global modules** — inject their services directly without importing the module.

### Feature Module Layout

Feature modules live in `src/modules/` and follow a modified DDD/Clean Architecture layering:

```
src/modules/{name}/
├── index.ts                  # Barrel: re-exports everything public from this module
├── {name}.module.ts
├── domain/                   # Entities & TypeScript interfaces (no framework/DB dependencies)
├── dto/                      # Request & response DTOs (class-validator + @nestjs/swagger)
├── application/              # One service class per use case (business logic only)
├── infrastructure/           # Repositories — the only layer that touches Prisma directly
└── {name}.controller.ts      # Single file if small; controllers/ folder if large or multi-concern
```

**The best reference module is `src/modules/messages/`** — it demonstrates the full pattern with multiple controllers, repositories, complex DTOs, Socket.IO integration, and queue dispatching.

### Layering Rules

- **Controllers** call application services only — never repositories or Prisma directly.
- **Application services** call repositories only — never `PrismaService` directly.
- **Repositories** are the sole entry point to the database.
- To use another module's data from a service, import that module and inject its **repository** (exported from the module) — never bypass the repository to access Prisma.
- Cross-cutting logic applied to multiple endpoints (e.g., ownership checks, resource existence) belongs in a **Guard** or **custom decorator**, not duplicated in services.

### Request Lifecycle

```
HTTP Request
  → LoggerMiddleware (all routes)
  → ThrottlerGuard (100 req/60s global)
  → JwtAuthGuard / OptionalJwtAuthGuard
  → Controller
  → Application Service
  → Repository (Prisma)
  → ResponseInterceptor (wraps in { message, code, data })
  → HttpExceptionFilter / AllExceptionsFilter (on error)
```

### Storage Architecture

Two storage systems serve different purposes:

- **MinIO** — source of truth for original files (images, voice messages, file attachments)
- **Cloudinary** — stores watermarked/optimized images for serving

Upload flow: upload original to MinIO → process/watermark → upload to Cloudinary → store both references in the `Brick`/`Message` JSON field.

### Real-time (Socket.IO)

- Namespace: `/chat`
- JWT passed at connection via `auth.token` or `query.token`
- REST API services call `SocketGateway` emitter methods after DB writes — the gateway never initiates business logic
- Online presence tracked in Redis; user is offline only when **all** socket connections close

### Background Jobs (BullMQ)

Four queues: `email`, `notifications`, `brick-description`, `photo-upload`. All queued via `QueueService`. Processors in `src/queue/processors/` extend `WorkerHost`. Notification jobs use a 10-minute delay for batching.

### Python Vision Service

Separate FastAPI microservice at `python/vision/` (port 8000). Called by the NestJS app over HTTP for AI image captioning (BLIP) and QR code decoding. Configured via `VISION_API_URL`. For any heavy computation or AI/ML tasks, prefer offloading to this service rather than running in-process.

## Key Conventions

### Path Aliases

All imports use TypeScript path aliases — never relative paths that cross module boundaries:

| Alias                                                                                      | Maps to                       |
| ------------------------------------------------------------------------------------------ | ----------------------------- |
| `@/*`                                                                                      | `src/*`                       |
| `@modules/*`                                                                               | `src/modules/*`               |
| `@auth/*`                                                                                  | `src/modules/auth/*`          |
| `@users/*`                                                                                 | `src/modules/users/*`         |
| `@bricks/*`                                                                                | `src/modules/bricks/*`        |
| `@follows/*`                                                                               | `src/modules/follows/*`       |
| `@notifications/*`                                                                         | `src/modules/notifications/*` |
| `@messages/*`                                                                              | `src/modules/messages/*`      |
| `@firebase/*`, `@redis/*`, `@email/*`, `@cloudinary/*`, `@minio/*`, `@cron/*`, `@socket/*` | corresponding `src/` dirs     |

### Response Format

All HTTP responses are automatically wrapped by `ResponseInterceptor`:

```json
{ "message": "OK", "code": 200, "data": { ... } }
```

Controllers return raw data; do not manually wrap.

### Auth Guards

- `@UseGuards(JwtAuthGuard)` — requires valid JWT (throws 401 otherwise)
- `@UseGuards(OptionalJwtAuthGuard)` — attaches user if token present, allows anonymous
- `@CurrentUser()` decorator — extracts `UserEntity` from request

Both guards and the decorator are exported from `@/common`.

### Service Granularity

Each use case is its own `@Injectable()` service class (e.g., `CreateBrickService`, `UpdateBrickService`, `DeleteBrickService`). Do not add unrelated methods to an existing service — create a new one.

### Logging

Every service and gateway uses NestJS's built-in logger, declared at class level:

```ts
private readonly logger = new Logger(MyService.name);
```

Use `logger.log()` for key business events, `logger.warn()` for suspicious-but-handled cases (e.g., request for non-existent email), and `logger.error()` in catch blocks. Never swallow errors silently.

### Fire-and-Forget Async Tasks

Non-critical async work (e.g., queuing a welcome email after registration) must not block the main response. Use `.catch()` instead of `await` to prevent failures from bubbling up:

```ts
// ✅ non-blocking, error logged but doesn't fail the request
this.queueService.sendWelcomeEmail(user.email).catch((err) => {
    this.logger.error('Failed to queue welcome email', err);
});

// ❌ blocks the response and makes email failure a user-facing error
await this.queueService.sendWelcomeEmail(user.email);
```

### Redis Key Naming

Redis keys follow the pattern `prefix:type:identifier`. Existing prefixes:

| Prefix                         | Usage                                      |
| ------------------------------ | ------------------------------------------ |
| `fp:otp:{email}`               | Forgot-password OTP + attempt counter      |
| `fp:reset:{email}`             | Forgot-password reset token (SHA-256 hash) |
| `ev:otp:{email}`               | Email-verification OTP                     |
| `photo-session:{sessionId}`    | One-time photo upload challenge            |
| `user:online:{userId}`         | Socket IDs for online tracking             |
| `conversation:typing:{convId}` | Typing indicator ZSET                      |

When adding new Redis keys, follow the same `namespace:type:identifier` format and document the key here.

### Redis Usage

Before storing state in an in-process variable (e.g., a `Map` or `Set` on a service), evaluate whether it should live in Redis instead. Use in-memory only for data that is truly ephemeral to a single process instance and does not need to survive a restart or scale across multiple instances. Examples already in Redis: online socket tracking, typing indicators, OTP codes, refresh token allowlists.

### Config-Driven Constants

Never hardcode timeouts, limits, or secrets. Read them from `ConfigService` with a sensible default:

```ts
this.maxAttempts = this.configService.get<number>('OTP_MAX_ATTEMPTS', 5);
this.otpExpiry = this.configService.get<number>('OTP_EXPIRY_SECONDS', 300);
```

All configurable values must also appear in `.env.example`.

### No Emoji or Icons in Source Code

Do not use emoji or icon characters anywhere in source code files — this includes comments, string literals, log messages, error messages, and variable names. Keep all source code plain ASCII text.

```ts
// ❌
this.logger.log('✅ Brick created successfully');
throw new BadRequestException('❌ Invalid file type');

// ✅
this.logger.log('Brick created successfully');
throw new BadRequestException('Invalid file type');
```

### Parallelise Independent Async Operations

Whenever two or more async operations do not depend on each other's result, run them with `Promise.all()` instead of sequential `await`. This is already applied throughout the codebase (paginated queries, file uploads, notification dispatching):

```ts
// ❌ sequential — unnecessarily slow
const brick = await this.brickRepo.findById(id);
const count = await this.brickRepo.count(where);

// ✅ parallel
const [brick, count] = await Promise.all([
    this.brickRepo.findById(id),
    this.brickRepo.count(where),
]);
```

Common cases where this applies: paginated `findMany` + `count`, uploading to MinIO + Cloudinary simultaneously, fetching multiple independent resources before assembling a response.

### Type-Only Imports

Use `import type` for anything that is only needed at compile time (interfaces, type aliases, enums used as types):

```ts
import type { JwtPayload, AuthTokens } from '@auth/domain';
import type { UserEntity } from '@users/domain';
```

### Barrel Exports

Every directory has an `index.ts` that re-exports all public symbols. Import from the barrel, not from the file directly:

```ts
// ✅
import { FindUserService } from '@users/application';
// ❌
import { FindUserService } from '@users/application/find-user.service';
```

### Module Exports — Principle of Least Exposure

A module should only export what other modules genuinely need. Internals stay private. Example: `AuthModule` only exports `JwtTokenService` even though it has 14 services.

### Guard + Decorator Pair Pattern

When a guard validates a resource and subsequent handlers need that resource, have the guard attach it to the request object and expose it via a matching parameter decorator — avoiding redundant DB lookups:

```ts
// Guard validates membership AND attaches conversation to req.conversation
@UseGuards(JwtAuthGuard, ConversationMemberGuard)
// Decorator extracts it cleanly
async getMessages(@GetConversation() conversation: ConversationEntity) { ... }
```

See `src/modules/messages/guards/` and `src/modules/messages/decorators/` for the reference implementation.

### Controller Parameter Validation

- Use `ParseUUIDPipe` on every path parameter that is a UUID: `@Param('id', ParseUUIDPipe) id: string`
- Use `@Type(() => Number)` + `@IsInt()` + `@Min()` on numeric query params to auto-coerce from string
- Use `@HttpCode(HttpStatus.OK)` on POST endpoints that are not resource-creation (e.g., login, logout, vote toggle)

### Swagger / API Docs

Controllers must have thorough Swagger annotations — this is the contract between backend and frontend:

- Annotate every endpoint with `@ApiOperation({ summary })` describing what it does
- Use `@ApiResponse` (or `@ApiOkResponse`, `@ApiCreatedResponse`) specifying the exact response DTO shape. For wrapped responses use `allOf` + `getSchemaPath`:
    ```ts
    schema: {
        allOf: [
            { $ref: getSchemaPath(ApiResponseDto) },
            { properties: { data: { $ref: getSchemaPath(MyDto) } } },
        ];
    }
    ```
- Add `@ApiProperty()` / `@ApiPropertyOptional()` on **every** DTO field with `description` and `example` that reflect business semantics (e.g., `description: '+1 = upvote, -1 = downvote'`)
- Document auth requirements with `@ApiBearerAuth()`
- Document query params, path params, and body fields so frontend developers can integrate without back-and-forth clarification

### Response DTOs — Static Factory Method

Response DTOs use a `static fromEntity()` factory method for mapping from Prisma results. Never do ad-hoc mapping inline in services:

```ts
export class BrickResponseDto {
    static fromEntity(brick: BrickWithRelations): BrickResponseDto {
        const dto = new BrickResponseDto();
        dto.id = brick.id;
        dto.latitude = brick.latitude ? Number(brick.latitude) : null; // Decimal → number
        return dto;
    }
}
```

### Domain Types — Interfaces, Not Classes

Types in `domain/` that represent data shapes (not entities with behaviour) are `interface`, not `class`. This keeps them zero-runtime-overhead:

```ts
// ✅ domain/message.types.ts
export interface MessageImageData { url: string; objectName: string; etag: string; }

// ❌ unnecessary class when no methods needed
export class MessageImageData { ... }
```

### Prisma — Reusable Select Shapes

For complex `include` objects that are reused across repository methods, define them as a typed constant using `satisfies` and derive the payload type from it:

```ts
const commentWithDetails = {
    user: { select: { id: true, username: true } },
    _count: { select: { votes: true } },
} satisfies Prisma.CommentInclude;

export type CommentWithDetails = Prisma.CommentGetPayload<{ include: typeof commentWithDetails }>;
```

### Prisma — JSONB Field Casting

Prisma types JSONB columns as `Prisma.JsonValue`. Cast to your domain type via `unknown` first:

```ts
const media = brick.media as unknown as MinioFileData;
```

### Prisma — Paginated Queries

All paginated repository methods run count and data fetch in parallel:

```ts
const [data, total] = await Promise.all([
    this.prisma.message.findMany({ where, take: limit, skip: offset }),
    this.prisma.message.count({ where }),
]);
return { data, total, limit, offset };
```

Paginated response DTOs always include: `{ data: T[], total: number, limit: number, offset: number }`.

### Security Patterns

- **Email enumeration prevention**: endpoints that accept an email (forgot password, resend OTP) always return `200 OK` even when the email does not exist. Log a warning internally but do not reveal the result to the caller.
- **Token hashing in Redis**: reset tokens are stored as SHA-256 hashes, never plaintext.
- **OTP attempt tracking**: the attempt counter is stored alongside the OTP value in the same Redis key; the key is deleted after max attempts are exceeded.
- **One-time session tokens**: consumed (deleted from Redis) immediately upon first valid use; checked for `used` flag before deletion.

### File Upload Patterns

- Validate magic bytes before processing: JPEG (`FF D8 FF`), PNG (`89 50 4E 47`)
- Validate file size: min 10 KB, max 10 MB (GLB models: 15 MB)
- Use `FileFieldsInterceptor` for multi-field uploads (images, voice, file in one request)
- MinIO object path convention: `{resource}/{contextId}/{type}/{uuid}-{originalFilename}` (e.g., `messages/conv-123/images/uuid-photo.jpg`)

### Type Safety

Avoid `any`. Use typed DTOs, domain entities, or explicit generic types. When a Prisma result shape is complex, map it into a typed entity or response DTO before returning. For literal union narrowing:

```ts
// Cast Prisma enum strings to typed literals
role: user.role.toLowerCase() as 'user' | 'admin',
```

### When to Run Lint/Build

- **Small changes** (single method, typo, config tweak): double-check manually, no commands required.
- **Medium or large changes** (new feature, refactor, cross-module changes): run `pnpm lint` then `pnpm build` to catch type errors and lint violations before committing.

### Renaming Features

When a feature, module, or entity is renamed, update **all** of the following consistently:

- Source files and folder names
- NestJS module class name and its `@Module()` references
- Path alias in `tsconfig.json` (if applicable)
- Docker service names and container names in `docker-compose.yml` and `Dockerfile`
- Queue names, cron job names, and any string identifiers referencing the old name
- Environment variable names in `.env.example` (and `.env`)

Do not rename only the code while leaving filenames, folder names, or Docker config unchanged.

### Database (Prisma)

- Schema: `prisma/schema.prisma` (PostgreSQL)
- All model fields use `snake_case` column names via `@map()`, camelCase in TypeScript
- Always run `pnpm prisma:migrate` (not `prisma:push`) to maintain migration history
- UUIDs are used for all primary keys (`@id @default(uuid()) @db.Uuid`)
- `Decimal` fields (e.g., latitude/longitude) must be converted to `Number` in response DTOs

### DTOs

- Use `class-validator` decorators for validation
- Use `@ApiProperty()` / `@ApiPropertyOptional()` from `@nestjs/swagger` on all DTO fields with meaningful descriptions and examples
- Response DTOs live in `dto/` alongside request DTOs

### Docker

When adding a new service or integration that requires infrastructure (e.g., a new queue processor needing a separate container, a new sidecar), check and update `docker-compose.yml` and `Dockerfile` accordingly. The Vision service (`python/vision/`) and MinIO are already defined there — use them as templates.

### Commit Messages

Follows Conventional Commits enforced by commitlint:

```
<type>(<optional scope>): <subject>
```

Allowed types: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ci`, `chore`, `revert`

### Environment

Copy `.env.example` to `.env`. Required services for local dev: PostgreSQL, Redis, MinIO (all in `docker-compose.yml`). Optional: Cloudinary, Firebase, SendGrid, LocationIQ, Vision service.
