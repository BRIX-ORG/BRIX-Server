# Architecture: NestJS Monolith

The BRIX Server is structured as a modular monolith. All feature logic resides in `src/modules/`, while cross-cutting concerns are in specialized root-level directories.

## Directory Structure (`src/`)

| Folder                                         | Purpose                                                                         |
| :--------------------------------------------- | :------------------------------------------------------------------------------ |
| `common/`                                      | Global utilities: guards, decorators, interceptors, filters, pipes.             |
| `config/`                                      | Typed configuration factories (App, DB, Cloudinary, etc.).                      |
| `modules/`                                     | **Core business logic (features)**: `users`, `auth`, `bricks`, `messages`, etc. |
| `prisma/`                                      | Global Database client.                                                         |
| `redis/`                                       | Global Redis client for caching and pub/sub.                                    |
| `socket/`                                      | Socket.IO gateway for real-time features.                                       |
| `queue/`                                       | **Centralized** BullMQ processors (all queues live here).                       |
| `cron/`                                        | **Centralized** scheduled tasks (Cron jobs).                                    |
| `email/`, `firebase/`, `cloudinary/`, `minio/` | Specialized infrastructure modules.                                             |

## Centralized Job Policy

`queue/` and `cron/` are centralized intentionally. All background jobs and scheduled tasks must be placed here so they can be audited and managed in one place rather than being scattered across modules.

## Global Modules

`redis/`, `email/`, and `socket/` are registered as global modules. You can inject their services directly without importing the module into your specific feature module.
