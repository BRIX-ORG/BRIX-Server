---
applyTo: 'src/socket/**, src/modules/messages/**'
---

# BRIX Real-time & Sockets

## Setup

- **Namespace**: `/chat`.
- **Auth**: JWT required at connection (passed via `auth.token`).

## Pattern

- REST API services are the source of truth.
- Services call `SocketGateway` emitter methods **after** successful DB writes.
- Sockets are primarily for downstream notification; logic stays in services.

## Online Presence

- Tracked in Redis using `user:online:{userId}`.
- User offline only when **all** open sockets for that ID are closed.
- Typing indicators use Redis ZSETs.
