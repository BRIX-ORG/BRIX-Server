# MinIO Storage Module

Module để quản lý file storage sử dụng MinIO - một object storage tương thích với S3.

## Tính năng

- Upload file lên MinIO
- Download file từ MinIO
- Delete file từ MinIO
- List files trong bucket
- Tạo presigned URLs
- Auto-create bucket khi khởi động

## Cấu hình

Thêm các biến môi trường sau vào file `.env`:

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=brix-storage
MINIO_USE_SSL=false
```

## Sử dụng

### Import Module

```typescript
import { Module } from '@nestjs/common';
import { MinioModule } from './minio';

@Module({
    imports: [MinioModule],
})
export class AppModule {}
```

### Inject Service

```typescript
import { Injectable } from '@nestjs/common';
import { MinioService } from './minio';

@Injectable()
export class FileService {
    constructor(private readonly minioService: MinioService) {}

    async uploadFile(file: Express.Multer.File) {
        const objectName = `uploads/${Date.now()}-${file.originalname}`;
        const result = await this.minioService.uploadFile(objectName, file.buffer, file.mimetype);
        return result;
    }

    async getFileUrl(objectName: string) {
        return await this.minioService.getFileUrl(objectName);
    }

    async deleteFile(objectName: string) {
        await this.minioService.deleteFile(objectName);
    }
}
```

## API Reference

### uploadFile(objectName, buffer, contentType)

Upload file lên MinIO.

**Parameters:**

- `objectName` (string): Tên/đường dẫn của object trong bucket
- `buffer` (Buffer): File buffer
- `contentType` (string): MIME type của file

**Returns:** `Promise<{ objectName: string; url: string; etag: string }>`

### getFileUrl(objectName, expirySeconds?)

Lấy URL của file (public hoặc presigned).

**Parameters:**

- `objectName` (string): Tên/đường dẫn của object
- `expirySeconds` (number, optional): Thời gian hết hạn (mặc định: 7 ngày)

**Returns:** `Promise<string>`

### deleteFile(objectName)

Xóa file từ MinIO.

**Parameters:**

- `objectName` (string): Tên/đường dẫn của object cần xóa

**Returns:** `Promise<void>`

### getFile(objectName)

Lấy file dưới dạng buffer.

**Parameters:**

- `objectName` (string): Tên/đường dẫn của object

**Returns:** `Promise<Buffer>`

### fileExists(objectName)

Kiểm tra file có tồn tại hay không.

**Parameters:**

- `objectName` (string): Tên/đường dẫn của object

**Returns:** `Promise<boolean>`

### listFiles(prefix?, recursive?)

List tất cả files trong một folder.

**Parameters:**

- `prefix` (string, optional): Prefix của folder (mặc định: '')
- `recursive` (boolean, optional): List đệ quy (mặc định: false)

**Returns:** `Promise<string[]>`

## MinIO Console

Truy cập MinIO Console tại: http://localhost:9001

- Username: minioadmin
- Password: minioadmin

## Kiến trúc

### Cloudinary vs MinIO

- **MinIO**: Source of truth - Lưu trữ file gốc
- **Cloudinary**: Lưu trữ ảnh đã watermark và optimize

### Flow upload ảnh

1. User upload ảnh → Lưu vào MinIO (original)
2. Xử lý ảnh (resize, optimize)
3. Thêm watermark
4. Upload ảnh đã watermark lên Cloudinary
5. Trả về cả 2 URLs:
    - MinIO URL: Original file
    - Cloudinary URL: Watermarked image

### Ví dụ Flow

```typescript
@Injectable()
export class ImageService {
    constructor(
        private readonly minioService: MinioService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    async uploadImage(file: Express.Multer.File) {
        // 1. Upload original to MinIO
        const originalName = `originals/${Date.now()}-${file.originalname}`;
        const minioResult = await this.minioService.uploadFile(
            originalName,
            file.buffer,
            file.mimetype,
        );

        // 2. Process image (add watermark, resize, etc.)
        const processedBuffer = await this.processImage(file.buffer);

        // 3. Upload watermarked to Cloudinary
        const cloudinaryResult = await this.cloudinaryService.uploadImage(processedBuffer, {
            folder: 'watermarked',
            // ... other options
        });

        return {
            original: {
                url: minioResult.url,
                objectName: minioResult.objectName,
            },
            watermarked: {
                url: cloudinaryResult.secure_url,
                publicId: cloudinaryResult.public_id,
            },
        };
    }
}
```

## Docker Setup

MinIO đã được cấu hình sẵn trong `docker-compose.yml`:

```yaml
minio:
    image: minio/minio:latest
    container_name: brix-minio
    ports:
        - '9000:9000' # API
        - '9001:9001' # Console
    volumes:
        - minio_data:/data
```

Khởi động services:

```bash
docker-compose up -d
```
