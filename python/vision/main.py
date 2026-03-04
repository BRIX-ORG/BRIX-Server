import io
import os
import logging
from contextlib import asynccontextmanager

import httpx
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
from pyzbar.pyzbar import decode as decode_qr
from transformers import BlipProcessor, BlipForConditionalGeneration

logger = logging.getLogger("vision")
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

    logger.info("Shutting down BRIX Vision Service")


app = FastAPI(
    title="BRIX Vision Service",
    description="Image captioning (BLIP) and QR code verification (pyzbar)",
    version="3.0.0",
    lifespan=lifespan,
)


# ─── Models ───────────────────────────────────────────────────────────────────


class DescribeRequest(BaseModel):
    image_url: str
    prompt: str = "Describe this image in detail."


class DescribeResponse(BaseModel):
    description: str


class QrDecodeRequest(BaseModel):
    image_url: str


class QrDecodeResponse(BaseModel):
    qr_data: list[str]  # List of decoded QR code text strings


# ─── Helpers ──────────────────────────────────────────────────────────────────


async def download_image(url: str) -> bytes:
    """Download image from URL (typically MinIO)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


# ─── Endpoints ────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "blip_loaded": model is not None,
    }


@app.post("/describe", response_model=DescribeResponse)
async def describe_image(request: DescribeRequest):
    """Generate a text description of the image using BLIP."""
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    try:
        content = await download_image(request.image_url)
        image = Image.open(io.BytesIO(content)).convert("RGB")

        logger.info(f"Image downloaded, size: {image.size}, generating caption...")

        device = next(model.parameters()).device
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


@app.post("/decode-qr", response_model=QrDecodeResponse)
async def decode_qr_code(request: QrDecodeRequest):
    """
    Decode QR codes from an uploaded webcam photo.

    Frontend renders a QR code containing an HMAC-signed token
    onto the captured image. This endpoint finds and decodes
    all QR codes in the image, returning the raw text data.
    Signature verification happens on the NestJS side.
    """
    try:
        content = await download_image(request.image_url)

        image = Image.open(io.BytesIO(content))

        # pyzbar can decode QR codes from PIL images directly
        decoded_objects = decode_qr(image)

        qr_data: list[str] = []
        for obj in decoded_objects:
            text = obj.data.decode("utf-8")
            qr_data.append(text)
            logger.info(f"QR decoded: type={obj.type}, data={text[:80]}...")

        if not qr_data:
            logger.warning("No QR codes found in image")

        return QrDecodeResponse(qr_data=qr_data)

    except httpx.HTTPError as e:
        logger.error(f"Failed to download image for QR decode: {e}")
        raise HTTPException(
            status_code=400, detail=f"Failed to download image: {str(e)}"
        )
    except Exception as e:
        logger.error(f"QR decode failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"QR decode failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("VISION_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
