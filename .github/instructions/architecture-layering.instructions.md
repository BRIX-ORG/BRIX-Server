---
applyTo: 'src/modules/**/*.ts'
---

# BRIX Architecture & Layering Rules

## Modular Monolith Structure

All business logic is isolated in `src/modules/{name}/`.

## Layering Pattern (Modified DDD)

1. **Domain**: Interfaces and types. Zero framework/DB dependencies.
2. **DTO**: Request validation and Response shapes.
3. **Application**: One service class per use case. Business logic only.
4. **Infrastructure**: Repositories. The **only** place allowed to touch `PrismaService`.
5. **Controller**: Entry point. Calls application services.

## Core Rules

- **Isolation**: Controllers → Services → Repositories.
- **Cross-Module**: Import the target module and inject its exported **repository**. Never access another module's Prisma tables directly.
- **Principle of Least Exposure**: Export only what is absolutely necessary (usually just the Module and Repository).
- **Barrel Exports**: Use `index.ts` to re-export public symbols. Import from the barrel path (e.g., `@users/application`).
