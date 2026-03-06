---
applyTo: '**'
---

# BRIX Commit, Lint & Build Workflow

## Conventional Commits

Format: `<type>(<scope>): <subject>`

- Types: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ci`, `chore`.

## Validation Rules

- **Small changes**: Manual review is sufficient.
- **Non-trivial changes**: You **must** run:
    1. `pnpm lint`
    2. `pnpm build`
    3. `pnpm test`

## Renaming Guidelines

If renaming a feature/module, update:

- Files, folders, and class names.
- Path aliases in `tsconfig.json`.
- Docker service names and identifiers.
- Environment variables in `.env.example`.
