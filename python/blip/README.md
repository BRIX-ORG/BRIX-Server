# BRIX Moondream2 Service

Image description generation service using [Moondream2](https://github.com/vikhyat/moondream).

## API

### `GET /health`

Health check — returns `{ "status": "ok", "model_loaded": true }`.

### `POST /describe`

Generate a description for an image.

**Request:**

```json
{
    "image_url": "http://minio:9000/brix/bricks/...",
    "prompt": "Describe this image in detail."
}
```

**Response:**

```json
{
    "description": "A beautiful landscape with..."
}
```

## Run Locally (without Docker)

```bash
cd python/moondream
pip install -r requirements.txt
python main.py
```

## Environment Variables

| Variable             | Default               | Description          |
| -------------------- | --------------------- | -------------------- |
| `MOONDREAM_PORT`     | `8000`                | Service port         |
| `MOONDREAM_MODEL_ID` | `vikhyatk/moondream2` | HuggingFace model ID |
| `MOONDREAM_REVISION` | `2025-01-09`          | Model revision       |

> **Note:** First startup will download the model (~3.6GB). Subsequent startups use the cached model.
>
> **GPU:** If CUDA is available, the model runs on GPU with float16 precision automatically.
