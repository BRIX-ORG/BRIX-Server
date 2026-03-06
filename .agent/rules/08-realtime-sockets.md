# Real-time: Socket.IO

The server maintains a websocket gateway for real-time interactions, primarily chat.

## Configuration

- **Namespace**: `/chat`
- **Auth**: JWT passed via `auth.token` or `query.token`.
- **Emitters**: REST API services call `SocketGateway` emitter methods after successful database writes. The gateway itself should not contain business logic.

## Presence Tracking

- Online status is tracked in Redis.
- A user is considered offline only when **all** active socket connections for that `userId` are closed.
- Real-time updates (online/offline) should be emitted to relevant peers (friends/conversation members).
