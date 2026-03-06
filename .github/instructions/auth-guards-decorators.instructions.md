---
applyTo: 'src/common/guards/**, src/common/decorators/**, src/modules/**/*.controller.ts'
---

# BRIX Auth, Guards & Decorators

## Core Guards

- `JwtAuthGuard`: Requires token, 401 if missing.
- `OptionalJwtAuthGuard`: Attaches user if token present, allows anonymous.

## Identity Pattern

- Use `@CurrentUser()` decorator to extract the `UserEntity` from the request.

## Guard + Decorator Pair Pattern

To optimize DB calls, have guards attach validated resources to the request object:

1. **Guard** checks resource (e.g., `ConversationMemberGuard`) and attaches it: `req.conversation = conversation`.
2. **Decorator** (e.g., `@GetConversation()`) extracts it in the controller handling.

_Reference: `src/modules/messages/guards/`_
