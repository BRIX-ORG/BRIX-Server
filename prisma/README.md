# BRIX Database Management (Prisma)

This project uses Prisma as an ORM to manage the PostgreSQL database. This document outlines the workflow for changing the database schema.

## Database Workfloww

Whenever you need to add, modify, or delete columns/tables, follow these steps:

### 1. The `_prisma_migrations` Table

This is an internal Prisma table used to track the history of your database updates.

- **NEVER** delete or modify this table manually.
- Prisma uses it to ensure your development environment stays in sync with production.

### 2. Changing the Schema

1.  **Modify the Schema**: Open `prisma/schema.prisma` and make your changes (e.g., adding a new field like `voice` to the `Message` model).
2.  **Generate a Migration**:

    ```bash
    npx prisma migrate dev --name your_migration_name
    ```

    - Prisma compares your schema with the current DB state.
    - It generates a SQL file in `prisma/migrations` and executes it.
    - This also automatically runs `prisma generate` to update the TypeScript types (Intellisense).

### 3. Useful Commands

| Command                    | Description                                                     |
| :------------------------- | :-------------------------------------------------------------- |
| `npx prisma migrate dev`   | Create a new migration and apply to DB (Development)            |
| `npx prisma generate`      | Update Prisma Client (TypeScript types & Intellisense)          |
| `npx prisma studio`        | Open Web UI to view and edit data easily                        |
| `npx prisma migrate reset` | **ERASE ALL DATA** and restart all migrations from scratch      |
| `npx prisma db push`       | Push schema directly to DB without migration (Use with caution) |

---

> [!IMPORTANT]
> Always use `migrate dev` instead of `db push` to ensure a consistent migration history across the team.
