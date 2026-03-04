import io
import os
import re
import logging
from contextlib import asynccontextmanager

import httpx
import torch
import easyocr
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

logger = logging.getLogger("vision")
logging.basicConfig(level=logging.INFO)

# Regex pattern to match nonce format: BRX-{4-8 alphanumeric chars}
NONCE_PATTERN = re.compile(r"BRX-[A-Z0-9]{4,8}")

# Global references
model = None
processor = None
ocr_reader = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load BLIP model and EasyOCR reader on startup."""
    global model, processor, ocr_reader

    # ─── BLIP (Image Captioning) ──────────────────────────────────────────
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

    # ─── EasyOCR (Nonce Verification) ─────────────────────────────────────
    logger.info("Loading EasyOCR reader (en)...")
    ocr_reader = easyocr.Reader(["en"], gpu=(device == "cuda"))
    logger.info("EasyOCR reader loaded successfully")

    yield

    logger.info("Shutting down BRIX Vision Service")


app = FastAPI(
    title="BRIX Vision Service",
    description="Image captioning (BLIP) and OCR nonce verification (EasyOCR)",
    version="2.0.0",
    lifespan=lifespan,
)


# ─── Models ───────────────────────────────────────────────────────────────────


class DescribeRequest(BaseModel):
    image_url: str
    prompt: str = "Describe this image in detail."


class DescribeResponse(BaseModel):
    description: str


class OcrRequest(BaseModel):
    image_url: str


class OcrResponse(BaseModel):
    nonces: list[str]  # Extracted nonce strings matching BRX-XXXXXX


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
        "ocr_loaded": ocr_reader is not None,
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


@app.post("/ocr", response_model=OcrResponse)
async def ocr_nonce(request: OcrRequest):
    """
    Extract nonce from the bottom-left ROI of a webcam photo.

    Frontend renders nonce as "BRX-{6_CHAR}" in bold monospace cyan text
    at the bottom-left corner. We crop that region (35% width × 12% height)
    and run OCR only on it to avoid false positives from environment text.
    """
    if ocr_reader is None:
        raise HTTPException(status_code=503, detail="OCR reader not loaded yet")

    try:
        content = await download_image(request.image_url)

        image = Image.open(io.BytesIO(content)).convert("RGB")
        w, h = image.size

        # ─── Crop ROI: bottom-left 35% width × 12% height ────────────────
        roi_w = int(w * 0.35)
        roi_h = int(h * 0.12)
        roi = image.crop((0, h - roi_h, roi_w, h))

        logger.info(
            f"Image {w}x{h}, cropped ROI: {roi_w}x{roi_h} (bottom-left)"
        )

        roi_np = np.array(roi)

        # ─── EasyOCR with detail mode (for confidence scores) ─────────────
        # detail=1 returns: [(bbox, text, confidence), ...]
        results = ocr_reader.readtext(roi_np, detail=1)

        logger.info(f"OCR raw results: {[(t, c) for (_, t, c) in results]}")

        # ─── Extract nonces matching BRX-XXXXXX pattern ───────────────────
        nonces: list[str] = []
        for _, text, confidence in results:
            if confidence < 0.5:
                continue

            # Clean up: remove spaces, uppercase
            clean = text.replace(" ", "").upper()
            match = NONCE_PATTERN.search(clean)
            if match:
                nonces.append(match.group())
                logger.info(
                    f"Nonce found: {match.group()} (confidence: {confidence:.2f})"
                )

        if not nonces:
            logger.warn("No nonce pattern found in ROI")

        return OcrResponse(nonces=nonces)

    except httpx.HTTPError as e:
        logger.error(f"Failed to download image for OCR: {e}")
        raise HTTPException(
            status_code=400, detail=f"Failed to download image: {str(e)}"
        )
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"OCR failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("VISION_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
