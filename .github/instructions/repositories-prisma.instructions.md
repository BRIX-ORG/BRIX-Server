---
applyTo: 'src/modules/**/infrastructure/*.ts, prisma/**'
---

# BRIX Prisma & Repository Rules

- **Entry Point**: Repositories are the **sole** layer that interacts with `PrismaService`.
- **Naming**: Database columns use `snake_case` (`@map`); TypeScript fields use `camelCase`.
- **IDs**: Use UUIDs for all primary keys (`@id @default(uuid()) @db.Uuid`).

## Query Patterns

- **Parallelism**: Independent `findMany` and `count` must run in `Promise.all()`.
- **Paginated Output**: Always return `{ data: T[], total, limit, offset }`.
- **JSONB**: Cast Prisma `JsonValue` to domain types via `unknown` (e.g., `data as unknown as MinioFileData`).
- **Reusable Selects**: Define `include`/`select` shapes as constants using `satisfies Prisma.XInclude` for type safety.

## Database Integrity

- `Decimal` fields (e.g., coordinates) must be converted to `Number` in the DTO layer.
- Ensure foreign keys and indexes follow project naming conventions.
