# Socket.IO — Chat Module (`/chat`)

## Overview

The BRIX chat system uses **Socket.IO** (`@nestjs/websockets`) at namespace `/chat`.  
Authentication is **JWT-based** — the token must be provided on connection. Unauthenticated connections are immediately disconnected.

**Endpoint:** `ws://<host>:<port>/chat`

---

## Authentication

Pass the JWT access token at connection time via either:

```js
// Option A — auth object
const socket = io('http://localhost:3000/chat', {
    auth: { token: '<access_token>' },
});

// Option B — query string
const socket = io('http://localhost:3000/chat', {
    query: { token: '<access_token>' },
});
```

If the token is missing or invalid, the server disconnects the client immediately.

---

## Events Reference

### Client → Server (emit from client, listen on server)

| Event               | Payload                      | Description                                            |
| ------------------- | ---------------------------- | ------------------------------------------------------ |
| `joinConversation`  | `{ conversationId: string }` | Join a conversation room to receive real-time messages |
| `leaveConversation` | `{ conversationId: string }` | Leave a conversation room                              |
| `typing`            | `{ conversationId: string }` | Broadcast that the current user is typing              |
| `stopTyping`        | `{ conversationId: string }` | Broadcast that the current user stopped typing         |

> **Note:** You must call `joinConversation` before you can receive any room-scoped events for that conversation.

---

### Server → Client (listen on client)

#### Global events (broadcast to all connected clients)

| Event         | Payload                                  | Description                                      |
| ------------- | ---------------------------------------- | ------------------------------------------------ |
| `userOnline`  | `{ userId: string }`                     | A user has connected                             |
| `userOffline` | `{ userId: string, lastSeenAt: string }` | A user has disconnected (last connection closed) |

#### Conversation-scoped events (only received after `joinConversation`)

| Event             | Payload                                                                                      | Description                                |
| ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `newMessage`      | `MessageResponseDto`                                                                         | A new message was sent in the conversation |
| `messageUpdated`  | `MessageResponseDto`                                                                         | A message's content was edited             |
| `messageDeleted`  | `{ messageId: string, conversationId: string }`                                              | A message was soft-deleted                 |
| `messageReaction` | `{ messageId: string, conversationId: string, reactions: Record<string, string[]> \| null }` | Reactions on a message changed             |
| `messagesRead`    | `{ conversationId: string, readerId: string }`                                               | All messages were marked as read by a user |
| `typing`          | `{ userId: string, conversationId: string }`                                                 | Another user is typing                     |
| `stopTyping`      | `{ userId: string, conversationId: string }`                                                 | Another user stopped typing                |

---

## `MessageResponseDto` Shape

```ts
{
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;

  // 1–3 images stored in MinIO
  images: Array<{
    url: string;
    objectName: string;
    etag: string;
    width?: number;
    height?: number;
  }> | null;

  // Voice message stored in MinIO
  voice: {
    url: string;
    objectName: string;
    etag: string;
    duration: number;   // seconds
    mimeType: string;
  } | null;

  // File attachment stored in MinIO
  file: {
    url: string;
    objectName: string;
    etag: string;
    fileName: string;
    fileSize: number;   // bytes
    mimeType: string;
  } | null;

  brickId: string | null;

  // { "👍": ["userId1"], "❤️": ["userId2"] }
  reactions: Record<string, string[]> | null;

  isRead: boolean;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

---

## Typical Client Flow

```
connect (with JWT)
  │
  ├─ receive: userOnline  (you appear online)
  │
  ├─ emit: joinConversation { conversationId }
  │    └─ now listening for room events
  │
  ├─ [user sends message via REST POST /api/messages]
  │    └─ receive: newMessage { ...MessageResponseDto }
  │
  ├─ emit: typing { conversationId }
  ├─ emit: stopTyping { conversationId }
  │
  ├─ [user calls REST POST /api/conversations/:id/read]
  │    └─ receive: messagesRead { conversationId, readerId }
  │
  ├─ emit: leaveConversation { conversationId }
  │
disconnect
  └─ receive (others): userOffline { userId, lastSeenAt }
```

---

## Implementation Notes

- **Online tracking** is done in-memory (`Map<userId, Set<socketId>>`). A user is considered offline only when **all** their socket connections close.
- `isOnline` and `lastSeenAt` on the `User` model are updated in the database on connect/disconnect.
- Real-time events are **emitted by the REST API services** (e.g., `SendMessageService`, `ReactMessageService`) — the socket gateway exposes emitter methods that services call after DB writes.
- Conversation rooms are keyed as `conversation:<conversationId>`.
