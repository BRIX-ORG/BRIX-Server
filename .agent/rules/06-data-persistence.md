# Data Persistence: Prisma & Redis

## PostgreSQL (Prisma)

- **Casing**: Model fields use `snake_case` in the DB (`@map("column_name")`) and `camelCase` in TS.
- **IDs**: Use UUIDs for all primary keys (`@id @default(uuid()) @db.Uuid`).
- **Paginated Queries**: Always run `findMany` and `count` in parallel using `Promise.all()`.
- **Reusable Selects**: Define complex `include` or `select` shapes as typed constants using `satisfies` to maintain type safety.
- **JSONB**: Cast JSONB fields through `unknown` to the domain interface (e.g., `data as unknown as MinioFileData`).

## Redis

Use Redis for state that must survive restarts or scale across instances (OTP, session tracking, typing indicators).

### Redis Key Conventions

Pattern: `namespace:type:identifier`

| Prefix                      | Usage                                      |
| :-------------------------- | :----------------------------------------- |
| `fp:otp:{email}`            | Forgot-password OTP + attempt counter      |
| `fp:reset:{email}`          | Forgot-password reset token (SHA-256 hash) |
| `ev:otp:{email}`            | Email-verification OTP                     |
| `photo-session:{sessionId}` | One-time photo upload challenge            |
| `user:online:{userId}`      | Socket IDs for online tracking             |
| `conversation:typing:{id}`  | Typing indicators (ZSET)                   |

## Security & Protection Patterns

- **Email Enumeration Prevention**: Endpoints (forgot password, etc.) must return `200 OK` even if the email doesn't exist. Log a warning internally.
- **Token Security**: Tokens (reset, etc.) must be stored as **SHA-256 hashes** in Redis, never plaintext.
- **OTP Protection**: Track attempts in the same Redis key; delete key after max attempts exceeded.
- **One-time Tokens**: Consume (delete) tokens immediately upon first valid use. Check `used` status before deletion.
