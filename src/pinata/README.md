# Pinata Module

IPFS storage service using Pinata SDK.

## Configuration

Add the following environment variables:

```env
PINATA_JWT_KEY=your_pinata_jwt_key
PINATA_GATEWAY=your-gateway.mypinata.cloud
```

## Usage

```typescript
import { PinataService } from '@pinata/pinata.service';

constructor(private readonly pinataService: PinataService) {}

// Upload file to IPFS
const result = await this.pinataService.uploadFile(file);

// Get gateway URL for a CID
const url = await this.pinataService.getFileUrl(cid);

// Delete/unpin file from IPFS
await this.pinataService.deleteFile(cid);
```

## Methods

| Method                       | Description                   |
| ---------------------------- | ----------------------------- |
| `uploadFile(file, name?)`    | Upload a file to IPFS         |
| `uploadMultipleFiles(files)` | Upload multiple files to IPFS |
| `getFile(cid)`               | Get file content from IPFS    |
| `getFileUrl(cid)`            | Get gateway URL for a CID     |
| `deleteFile(cid)`            | Unpin file from IPFS          |
| `getGatewayUrl()`            | Get configured gateway URL    |
