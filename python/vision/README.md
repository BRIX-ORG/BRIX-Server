# BRIX Vision Serviceeee

Image processing microservice for the BRIX platform. This service provides AI-powered image analysis and utility functions.

## Features

- **BLIP Image Captioning** — Generates detailed text descriptions from images using the BLIP model.
- **QR Code Decoding** — Fast and reliable QR code extraction using `pyzbar` for HMAC-signed session verification.

## Endpoints

| Method | Path         | Description                                          |
| :----- | :----------- | :--------------------------------------------------- |
| `GET`  | `/health`    | Service health check                                 |
| `POST` | `/describe`  | Generate image caption (requires `image_url`)        |
| `POST` | `/decode-qr` | Extract raw data from all QR codes found in an image |

## API Examples

### Image Captioning

```json
// POST /describe
{
    "image_url": "https://example.com/image.jpg",
    "prompt": "Describe this image" // Optional
}
```

### QR Decoding

```json
// POST /decode-qr
{
    "image_url": "https://example.com/photo.jpg"
}
```

## Setup & Deployment

### Hardware Requirements

- **CUDA Support**: Recommended for faster BLIP inference.
- **CPU Fallback**: Automatically falls back to CPU (torch float32) if CUDA is unavailable.

### Docker

```bash
docker build -t brix-vision .
docker run -p 8000:8000 brix-vision
```

## Environment Variables

| Variable        | Default                                 | Description                |
| :-------------- | :-------------------------------------- | :------------------------- |
| `BLIP_MODEL_ID` | `Salesforce/blip-image-captioning-base` | HuggingFace model ID       |
| `VISION_PORT`   | `8000`                                  | Port to run the service on |
