---
applyTo: 'src/**/*.ts'
---

# BRIX Redis Usage & Key Naming

## State Policy

Avoid in-process variables (Map/Set) for shared state. Use Redis for data that must survive restarts or scale across instances.

## Key Convention

`prefix:type:identifier`

| Prefix                     | Usage                          |
| :------------------------- | :----------------------------- |
| `fp:otp:{email}`           | Forgot-password OTP + attempts |
| `fp:reset:{email}`         | Forgot-password reset hash     |
| `ev:otp:{email}`           | Email-verification OTP         |
| `photo-session:{id}`       | Upload challenge session       |
| `user:online:{id}`         | Socket status tracking         |
| `conversation:typing:{id}` | Typing indicators (ZSET)       |

## Implementation

- Hash sensitive tokens (SHA-256) before storing in Redis.
- Always implement TTL/expiry for temporary data.
