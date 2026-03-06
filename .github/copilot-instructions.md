# BRIX Server — Copilot Instructions

## Overview

NestJS monolith for BRIX social/media platform. Bricks are media content (images/3D/video) with location verification. Follow DDD/Clean Architecture layering in `src/modules/`.

## Commands

- Use **pnpm only**.
- `pnpm start:dev` / `pnpm build`
- `pnpm test` / `pnpm lint` / `pnpm format`
- Prisma: `migrate` (not `push`).
- Docker: `docker-compose up -d` for infra (DB, Redis, MinIO).

## Architecture Summary

| Folder     | Purpose                                                      |
| :--------- | :----------------------------------------------------------- |
| `modules/` | Feature logic (users, auth, bricks, messages, etc.)          |
| `common/`  | Global guards, decorators, interceptors, filters.            |
| Global     | `prisma/`, `redis/`, `email/`, `socket/`, `queue/`, `cron/`. |

- **Feature Layout**: `domain/` → `dto/` → `application/` (services per use-case) → `infrastructure/` (repos) → `controller`.
- **Storage**: MinIO (original) + Cloudinary (watermarked).
- **Real-time**: Socket.IO `/chat` namespace.
- **Queues**: BullMQ (email, notifications, brick-description, photo-upload).
- **Vision**: FastAPI sidecar for AI captioning and QR decoding.

## Core Rules

- **Path Aliases**: Always use `@modules/*`, `@users/*`, etc. Never cross-module relative paths.
- **Response**: Auto-wrapped `{ message, code, data }` via `ResponseInterceptor`.
- **Auth**: `JwtAuthGuard` / `OptionalJwtAuthGuard` + `@CurrentUser()`.
- **Services**: One service class per use-case (e.g., `CreateBrickService`).
- **Logging**: Class-level `Logger`. No silent errors or console.logs.
- **Async**: `Promise.all` for independent ops; `.catch()` for non-critical fire-and-forget.
- **Redis**: Use `prefix:type:identifier` naming.
- **No Emojis**: Keep source code plain ASCII.
- **Swagger**: Mandatory high-quality `@ApiOperation`, `@ApiResponse`, and `@ApiProperty` with realistic examples to ensure easy frontend integration and accurate data contracts.

> **Note**: For detailed rules, refer to path-specific instructions in `.github/instructions/*.instructions.md`.

## Before Coding Checklist

1. Check existing implementations for patterns.
2. Use `src/modules/messages/` as the gold standard.
3. Ensure types are in `domain/` (interfaces) and DTOs in `dto/`.
4. Run `pnpm lint` and `pnpm build` after any non-trivial change.
