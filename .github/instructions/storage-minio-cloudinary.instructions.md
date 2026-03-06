---
applyTo: 'src/modules/bricks/**, src/modules/messages/**'
---

# BRIX Storage Flow: MinIO & Cloudinary

## Two-Stage Strategy

1. **MinIO**: Original file storage (Source of Truth).
2. **Cloudinary**: Optimized, watermarked versions for public delivery.

## Upload Rules

- **Validation**:
    - Magic Bytes check: JPEG (`FF D8 FF`), PNG (`89 50 4E 47`).
    - Size check: 10KB - 10MB (GLB: 15MB).
- **Paths**: `{resource}/{contextId}/{type}/{uuid}-{filename}`.
- **Processing**: Upload to MinIO → Dispatch BullMQ job → Process/Watermark → Upload to Cloudinary.
- **Reference**: Entities store both MinIO and Cloudinary references in a JSON media field.
