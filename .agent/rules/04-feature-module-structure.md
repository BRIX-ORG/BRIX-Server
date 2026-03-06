# Feature Module Structure

Every feature module in `src/modules/{name}/` follows a Clean Architecture layering pattern.

## Folder Layout

```
src/modules/{name}/
├── index.ts                  # Barrel: re-exports everything public
├── {name}.module.ts          # Module definition
├── domain/                   # Entities & TS interfaces (DB agnostic)
├── dto/                      # Request & response DTOs (validation/swagger)
├── application/              # One service class per use case (business logic)
├── infrastructure/           # Repositories (only layer touching Prisma)
└── {name}.controller.ts      # REST endpoints
```

## Layering Rules

1.  **Strict Isolation**: Controllers → Applications Services → Repositories.
2.  **No Direct DB Access**: Repositories are the **only** layer that interacts with `PrismaService`.
3.  **Cross-Module Access**: To use another module's data, inject its **Repository** (if exported) or its service. Never bypass repositories to access another module's tables via Prisma directly.
4.  **Granularity**: Each service class should handle a single use case (e.g., `CreateBrickService`, `FindUserByEmailService`).
5.  **Barrel Exports**: Directories must have an `index.ts`. Always import from the barrel: `@users/application`, not `@users/application/find-user.service`.

## Reference Implementation

**`src/modules/messages/`** is the gold standard for this architecture. Use it as a template for new feature modules.
