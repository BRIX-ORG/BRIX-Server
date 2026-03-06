---
applyTo: 'src/queue/**'
---

# BRIX BullMQ Queues

## Active Queues

- `email`: User communications.
- `notifications`: Push and in-app alerts (10-min batch delay).
- `brick-description`: Async AI processing for bricks.
- `photo-upload`: Image watermarking and Cloudinary sync.

## Implementation

- Use `QueueService` to dispatch jobs.
- Workers live in `src/queue/processors/` and extend `WorkerHost`.
- Use Redis for the queue backend.
