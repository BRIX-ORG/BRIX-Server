---
description: Refactor a legacy component/module to follow current BRIX Clean Architecture conventions
---

# Refactor Legacy Module (BRIX-Server)

Follow these steps to transition a non-standard module into the BRIX layered architecture.

## Steps

1.  **Analyze current dependencies**:
    - Identify where `PrismaService` is directly used (controllers or services).
    - Identify where business logic is mixed with repository logic.

2.  **Scaffold new directory structure**:

    ```bash
    mkdir -p src/modules/<name>/{domain,dto,application,infrastructure}
    ```

3.  **Extract Data Shapes to Domain**:
    - Create `<name>.types.ts` in `domain/`.
    - Note: Use `interface` for data-only shapes.

4.  **Extract Data Access to Infrastructure**:
    - Create `<name>.repository.ts`.
    - Move all `prisma.xxxx` calls into the repository methods.
    - Export the repository from the module.

5.  **Refactor Services to Application**:
    - Move business logic to `<use-case>.service.ts`.
    - Replace direct Prisma calls with Repository calls.
    - Ensure one service per use case.

6.  **Refactor DTOs**:
    - Ensure all input and output objects are proper classes in `dto/`.
    - Add `class-validator` decorators.
    - Add Swagger `@ApiProperty()` decorators.
    - Implement `static fromEntity()` for response mapping.

7.  **Standardize Controller**:
    - Replace direct repo/prisma injections with Services.
    - Ensure all endpoints have proper Swagger descriptions.
    - Use `@CurrentUser()` for auth.

8.  **Update Barrel Export**:
    - Re-export everything from `index.ts`.

// turbo 9. **Run Formatting**: `pnpm format`

10. **Verify Build**: `pnpm lint && pnpm build`
