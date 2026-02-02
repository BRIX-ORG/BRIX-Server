# Cloudinary Module

Module tích hợp Cloudinary để upload và quản lý images và GLB files cho BRIX.

## Cấu hình

Thêm vào file `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Sử dụng

### 1. Inject CloudinaryService vào module của bạn

```typescript
import { CloudinaryService } from '@/cloudinary';

@Injectable()
export class YourService {
    constructor(private readonly cloudinaryService: CloudinaryService) {}
}
```

### 2. Upload single image

```typescript
async uploadImage(file: Express.Multer.File) {
    // Upload vào folder BRIX/
    const result = await this.cloudinaryService.uploadImage(file);

    // Upload vào subfolder BRIX/users/
    const result = await this.cloudinaryService.uploadImage(file, 'users');

    return result; // { url, publicId, width, height, format, resourceType }
}
```

### 3. Upload multiple images

```typescript
async uploadMultipleImages(files: Express.Multer.File[]) {
    const results = await this.cloudinaryService.uploadMultipleImages(files, 'gallery');
    return results; // Array of UploadResult
}
```

### 4. Upload GLB file

```typescript
async uploadGlbFile(file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadGlbFile(file, 'models');
    return result; // { url, publicId, format, resourceType }
}
```

### 5. Upload multiple GLB files

```typescript
async uploadMultipleGlbFiles(files: Express.Multer.File[]) {
    const results = await this.cloudinaryService.uploadMultipleGlbFiles(files, 'models');
    return results;
}
```

### 6. Delete file

```typescript
async deleteImage(publicId: string) {
    await this.cloudinaryService.deleteFile(publicId, 'image');
}

async deleteGlbFile(publicId: string) {
    await this.cloudinaryService.deleteFile(publicId, 'raw');
}
```

### 7. Delete multiple files

```typescript
async deleteMultipleImages(publicIds: string[]) {
    await this.cloudinaryService.deleteMultipleFiles(publicIds, 'image');
}
```

## Folder Structure trên Cloudinary

Tất cả files được upload vào base folder `BRIX/`:

```
BRIX/
├── users/          # User avatars, backgrounds
├── bricks/         # Brick images
├── models/         # GLB files
└── [custom]/       # Custom subfolders
```

## API Response

```typescript
interface UploadResult {
    url: string; // Secure URL to access file
    publicId: string; // Cloudinary public ID (for deletion)
    width?: number; // Image width (only for images)
    height?: number; // Image height (only for images)
    format?: string; // File format (jpg, png, glb, etc.)
    resourceType?: string; // 'image' or 'raw'
}
```

## Example Controller

```typescript
import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '@/cloudinary';

@Controller('upload')
export class UploadController {
    constructor(private readonly cloudinaryService: CloudinaryService) {}

    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        return this.cloudinaryService.uploadImage(file, 'users');
    }

    @Post('images')
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
        return this.cloudinaryService.uploadMultipleImages(files, 'gallery');
    }

    @Post('glb')
    @UseInterceptors(FileInterceptor('file'))
    async uploadGlb(@UploadedFile() file: Express.Multer.File) {
        return this.cloudinaryService.uploadGlbFile(file, 'models');
    }
}
```

## Notes

- Module được đánh dấu `@Global()` nên có thể sử dụng ở bất kỳ module nào mà không cần import
- Images tự động tối ưu với `quality: auto` và `fetch_format: auto`
- GLB files được upload với resource type `raw`
- Tất cả operations đều có error handling và logging
