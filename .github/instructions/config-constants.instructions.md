---
applyTo: 'src/config/**, src/**/*.ts'
---

# BRIX Configuration & Constants

- **No Hardcoding**: Never hardcode timeouts, limits, or secrets in code logic.
- **ConfigService**: Use NestJS `ConfigService` with sensible defaults.
    ```ts
    this.timeout = this.timeout = this.configService.get<number>('API_TIMEOUT', 5000);
    ```
- **Environment**: Every configurable variable must be documented in `.env.example`.
- **Typing**: Values retrieved from ConfigService should be typed using generics.
