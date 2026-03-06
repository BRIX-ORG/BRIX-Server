---
applyTo: 'src/**/*.ts'
---

# BRIX Security Patterns

- **Email Enumeration Prevention**: Endpoints (forgot-password, OTP) return `200 OK` whether the email exists or not.
- **Token Hashing**: All reset/verification tokens must be stored as SHA-256 hashes in Redis.
- **One-time Tokens**: Consume/delete tokens immediately upon first successful use. Check for `used` status before deletion.
- **Visibility**: Global `ThrottlerGuard` enforces rate limits (100 req/min).
