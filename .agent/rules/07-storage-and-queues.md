# Storage, Queues & Sidecars

## File Storage (MinIO & Cloudinary)

BRIX uses a two-system storage strategy:

1.  **MinIO**: Source of truth for original uploaded files.
2.  **Cloudinary**: Optimized, watermarked versions for public delivery.

### Upload Flow

1.  **Validation**:
    - Validate **Magic Bytes**: JPEG (`FF D8 FF`), PNG (`89 50 4E 47`).
    - Validate **File Size**: Min 10 KB, Max 10 MB (GLB models: 15 MB).
2.  **Upload original to MinIO** using convention: `{resource}/{contextId}/{type}/{uuid}-{originalFilename}`.
3.  **Queue processing job** → Process/Watermark → Upload to Cloudinary.
4.  **Store References**: Both references stored in the entity's JSON media field.

## Background Jobs (BullMQ)

Queues: `email`, `notifications`, `brick-description`, `photo-upload`.

- Use `QueueService` to dispatch jobs.
- Workers live in `src/queue/processors/`.
- Notifications use a 10-minute delay for potential batching.

## Python Vision Sidecar

Located at `python/vision/`.

- Used for AI tasks: Image captioning (BLIP) and QR code decoding.
- Communication over HTTP via `VISION_API_URL`.
- Heavy ML/Vision computations should **always** be offloaded to this service.
