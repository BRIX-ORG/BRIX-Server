---
applyTo: 'src/modules/**/application/*.ts'
---

# BRIX Services & Use Cases

- **Granularity**: One service class per use-case (e.g., `FindUserService` not `UserService`).
- **Dependencies**: Inject Repositories, not `PrismaService`.

## Runtime Behavior

- **Logging**: Every service must have a private `Logger`.
    ```ts
    private readonly logger = new Logger(MyService.name);
    ```
- **Fire-and-Forget**: Non-critical tasks (emails, notifications) should use `.catch()` instead of `await`.
    ```ts
    this.queue.sendMail(user).catch((e) => this.logger.error('Mail failed', e));
    ```
- **Async Efficiency**: Use `Promise.all()` whenever operations are independent.

## Error Handling

- Use standard NestJS `HttpException` subclasses (e.g., `NotFoundException`).
- Never swallow errors silently; always log at `error` level with context.
