---
applyTo: '**'
---

# BRIX Commands & Infrastructure

## Package Management

- Use **pnpm exclusively**. `npm` and `yarn` are prohibited.

## Database (Prisma)

- **Always migrate**: Use `pnpm prisma:migrate`. Never use `prisma:push`.
- `pnpm prisma:generate`: Regenerate client after schema changes.
- `pnpm prisma:studio`: DB GUI.
- `pnpm prisma:reset`: Full wipe and replay migrations.

## Infrastructure (Docker)

- `docker-compose up -d`: Required for local DB, Redis, and MinIO.
- Base images and service names in `docker-compose.yml` must be updated if infrastructure dependencies change.

## Development Lifecycle

- `pnpm start:dev`: Hot reload.
- `pnpm test`: Jest unit tests.
- `pnpm lint` / `pnpm format`: Must pass before committing.
