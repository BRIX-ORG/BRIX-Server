# Coding Conventions & Best Practices

## TypeScript Path Aliases

Always use TypeScript path aliases. Never use relative paths that cross module boundaries.

| Alias                                                                                      | Maps to                          |
| :----------------------------------------------------------------------------------------- | :------------------------------- |
| `@/*`                                                                                      | `src/*`                          |
| `@modules/*`                                                                               | `src/modules/*`                  |
| `@auth/*`                                                                                  | `src/modules/auth/*`             |
| `@users/*`                                                                                 | `src/modules/users/*`            |
| `@bricks/*`                                                                                | `src/modules/bricks/*`           |
| `@follows/*`                                                                               | `src/modules/follows/*`          |
| `@notifications/*`                                                                         | `src/modules/notifications/*`    |
| `@messages/*`                                                                              | `src/modules/messages/*`         |
| `@firebase/*`, `@redis/*`, `@email/*`, `@cloudinary/*`, `@minio/*`, `@cron/*`, `@socket/*` | Corresponding `src/` directories |

## Logging

Every service and gateway must use the NestJS `Logger`.

```ts
private readonly logger = new Logger(MyService.name);
```

- `log()`: Key business events.
- `warn()`: Suspicious/handled edge cases (e.g., duplicate email request).
- `error()`: Catch blocks (never swallow errors silently).

## Module Governance

- **Principle of Least Exposure**: A module should only export what other modules genuinely need. Keep internals private.
- **Service Granularity**: One service class per use case (e.g. `UpdateBrickService`). Do not combine unrelated logic.

## Async Best Practices

### Parallelization

If operations are independent, use `Promise.all()`.

```ts
// ✅ Correct
const [data, total] = await Promise.all([this.repo.find(), this.repo.count()]);
```

### Fire-and-Forget

For non-critical background tasks (e.g., sending a welcome email), use `.catch()` instead of `await` to prevent the primary request from failing.

```ts
this.queue.sendEmail(user).catch((err) => this.logger.error('Email failed', err));
```

## Source Code Hygiene

- **No Emoji**: Do not use emoji characters in source code, comments, or log messages. Keep code pure ASCII.
- **Type-Only Imports**: Use `import type` for interfaces and types.
- **Config-Driven**: Never hardcode timeouts or constants. Read from `ConfigService` with defaults.
- **Barrel Exports**: Every directory has an `index.ts`. Import from barrel, not file.
