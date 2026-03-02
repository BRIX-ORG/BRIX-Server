import io
import os
import logging
from contextlib import asynccontextmanager

import httpx
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

logger = logging.getLogger("blip")
logging.basicConfig(level=logging.INFO)

# Global references
model = None
processor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load BLIP model on startup."""
    global model, processor

    model_id = os.getenv("BLIP_MODEL_ID", "Salesforce/blip-image-captioning-base")

    logger.info(f"Loading BLIP model: {model_id}")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    logger.info(f"Using device: {device}, dtype: {dtype}")

    processor = BlipProcessor.from_pretrained(model_id)
    model = BlipForConditionalGeneration.from_pretrained(
        model_id,
        torch_dtype=dtype,
    ).to(device)
    model.eval()

    logger.info("BLIP model loaded successfully")
    yield
    logger.info("Shutting down BLIP service")


app = FastAPI(
    title="BRIX Image Caption Service",
    description="Image description generation using BLIP",
    version="1.0.0",
    lifespan=lifespan,
)


class DescribeRequest(BaseModel):
    image_url: str
    prompt: str = "Describe this image in detail."


class DescribeResponse(BaseModel):
    description: str


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/describe", response_model=DescribeResponse)
async def describe_image(request: DescribeRequest):
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    try:
        # Download image from URL (MinIO)
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(request.image_url)
            response.raise_for_status()

        image = Image.open(io.BytesIO(response.content)).convert("RGB")

        logger.info(f"Image downloaded, size: {image.size}, generating caption...")

        device = next(model.parameters()).device

        # Process image with BLIP
        inputs = processor(image, return_tensors="pt").to(device)

        with torch.no_grad():
            out = model.generate(
                **inputs,
                max_length=100,
                num_beams=5,
                temperature=1.0,
            )

        description = processor.decode(out[0], skip_special_tokens=True)

        logger.info(f"Generated description: {description[:80]}...")

        return DescribeResponse(description=description)

    except httpx.HTTPError as e:
        logger.error(f"Failed to download image: {e}")
        raise HTTPException(
            status_code=400, detail=f"Failed to download image: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Failed to generate description: {e}")
        raise HTTPException(
            status_code=500, detail=f"Description generation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("MOONDREAM_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
