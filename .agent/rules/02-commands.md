# Commands

This project uses **`pnpm`** exclusively. **Do not use `npm` or `yarn`.**

## Development & Build

```bash
pnpm start:dev          # Start with hot reload
pnpm build              # Compile TypeScript via NestJS CLI
pnpm dev                # Start developer environment (watch mode)
```

## Testing

Jest is used for all unit and integration tests.

```bash
pnpm test               # Run all unit tests
pnpm test:watch         # Watch mode
pnpm test:e2e           # End-to-end tests
# Run a specific test:
pnpm test -- --testPathPattern="src/modules/users/application/find-user.service.spec.ts"
```

## Linting & Formatting

ESLint and Prettier are strictly enforced.

```bash
pnpm lint               # ESLint with auto-fix
pnpm format             # Prettier write — run this after every code change
pnpm format:check       # Prettier check (CI)
```

## Database (Prisma)

Always use `prisma:migrate` to maintain history.

```bash
pnpm prisma:migrate     # Create + apply migration (dev)
pnpm prisma:generate    # Regenerate Prisma Client types
pnpm prisma:studio      # Open DB browser UI
pnpm prisma:reset       # Erase all data and replay migrations
```

## Infrastructure (Docker)

Development-critical infrastructure must be running for local testing.

```bash
docker-compose up -d    # Start PostgreSQL, Redis, MinIO
docker-compose down     # Stop all containers
```
