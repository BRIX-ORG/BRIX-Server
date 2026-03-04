FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (libzbar0 for pyzbar QR decoding)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libzbar0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install PyTorch CPU-only (~200MB instead of ~800MB with CUDA)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "main.py"]
