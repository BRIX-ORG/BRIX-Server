---
description: Scaffold a new backend feature (module + repository + services + DTOs + controller + barrel)
---

# Create New Backend Feature (BRIX-Server)

Follow these steps to scaffold a complete new NestJS feature module using Clean Architecture patterns.

## Steps

1.  **Create the module structure** in `src/modules/<name>/`:

    ```bash
    mkdir -p src/modules/<name>/{domain,dto,application,infrastructure}
    ```

2.  **Define Domain interfaces** in `src/modules/<name>/domain/`:
    - Create `<name>.types.ts`.
    - Note: Use `interface` for state shapes (not class).

3.  **Create DTOs** in `src/modules/<name>/dto/`:
    - Create request and response DTO classes.
    - Use `class-validator` for input validation.
    - Use `@ApiProperty()` for Swagger documentation.
    - Add `static fromEntity()` factory methods to Response DTOs.

4.  **Implement Repository** in `src/modules/<name>/infrastructure/`:
    - Create `<name>.repository.ts` injecting `PrismaService`.
    - This is the ONLY layer allowed to touch Prisma.

5.  **Create Application Services** in `src/modules/<name>/application/`:
    - One file/class per use case (e.g., `CreateXService.ts`, `FindXService.ts`).
    - Inject the repository, NEVER the database service directly.

6.  **Implement Controller** in `src/modules/<name>/<name>.controller.ts`:
    - Annotate with `@Controller()` and `@ApiTags()`.
    - Inject services (not repositories).
    - Ensure all endpoints have `@ApiOperation` and `@ApiResponse`.

7.  **Define NestJS Module** in `src/modules/<name>/<name>.module.ts`:
    - Declare controllers, providers (repositories + services), and exports (repositories/services).

8.  **Create Barrel Export** in `src/modules/<name>/index.ts`:
    - Re-export the module, repository, services, and DTOs.

9.  **Register the Module** in `src/app.module.ts` (or relevant parent module).

// turbo 10. **Run Formatting**: `pnpm format`

11. **Verify Build**: `pnpm build`
