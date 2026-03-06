# Development Workflow

## Before Starting a Feature

1.  Check existing implementations in the target module.
2.  Review the `src/modules/messages/` module for reference patterns.
3.  Ensure local infrastructure (Postgres, Redis, MinIO) is running via Docker.

## Renaming Guidelines

If you rename a feature, entity, or module, you **must** update:

- Files and folders.
- NestJS class names and `@Module()` references.
- Path aliases in `tsconfig.json`.
- Docker service names and container names in `docker-compose.yml` and `Dockerfile`.
- Queue names, cron job names, and any string identifiers.
- Environment variable names in `.env.example` and `.env`.

## Validation Checklist

- **Small changes**: Manual verification.
- **Medium/Large changes**:
    1. `pnpm lint` (Catch style/lint violations).
    2. `pnpm build` (Catch type errors).
    3. `pnpm test` (Ensure no regressions).

## Commit Messages

Conventional Commits: `<type>(<scope>): <subject>`
Types: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ci`, `chore`.
