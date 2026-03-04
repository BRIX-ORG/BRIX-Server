# BRIX Vision Service

Image processing microservice for the BRIX platform.

## Features

- **BLIP Image Captioning** — Generates descriptions from images (`POST /describe`)
- **EasyOCR Text Extraction** — Extracts text for nonce verification (`POST /ocr`)

## Endpoints

| Method | Path        | Description                         |
| ------ | ----------- | ----------------------------------- |
| GET    | `/health`   | Health check                        |
| POST   | `/describe` | Generate image caption via BLIP     |
| POST   | `/ocr`      | Extract text from image via EasyOCR |

## Docker

```bash
docker build -t brix-vision .
docker run -p 8000:8000 brix-vision
```

## Environment Variables

| Variable        | Default                                 | Description          |
| --------------- | --------------------------------------- | -------------------- |
| `BLIP_MODEL_ID` | `Salesforce/blip-image-captioning-base` | HuggingFace model ID |
| `VISION_PORT`   | `8000`                                  | Service port         |
