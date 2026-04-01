# Build stage
FROM node:25-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema for building
COPY prisma/ ./prisma/

# Skip pnpm check & ignore scripts (to skip husky)
ENV SKIP_PNPM_CHECK=true
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma Client & Build
RUN pnpm exec prisma generate
RUN pnpm build

# Production stage
FROM node:25-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma/ ./prisma/

# Install only production dependencies
ENV SKIP_PNPM_CHECK=true
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Generate Prisma Client for production
RUN pnpm exec prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Default ENV to satisfy application checks, these can be overridden at runtime
ENV NODE_ENV=development \
    APP_PORT=3000 \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_USERNAME=brix_user \
    DB_PASSWORD=brix_password \
    DB_DATABASE=brix_db \
    REDIS_HOST=localhost \
    REDIS_PORT=6379 \
    REDIS_DB=0 \
    MINIO_ENDPOINT=localhost \
    MINIO_PORT=9000 \
    MINIO_CONSOLE_PORT=9001 \
    MINIO_ACCESS_KEY=your_minio_access_key \
    MINIO_SECRET_KEY=your_minio_secret_key \
    MINIO_BUCKET_NAME=your_bucket_name \
    MINIO_USE_SSL=false \
    CLOUDINARY_CLOUD_NAME=your_cloud_name \
    CLOUDINARY_API_KEY=your_api_key \
    CLOUDINARY_API_SECRET=your_api_secret \
    PINATA_JWT_KEY=your_pinata_jwt_key \
    PINATA_GATEWAY=your-gateway.mypinata.cloud \
    DATABASE_URL="postgresql://brix_user:brix_password@localhost:5432/brix_db" \
    JWT_SECRET=your_jwt_secret \
    JWT_EXPIRES_IN=15m \
    JWT_REFRESH_SECRET=your_jwt_refresh_secret \
    JWT_REFRESH_EXPIRES_IN=7d \
    FIREBASE_SERVICE_ACCOUNT_BASE64=your_firebase_service_account_base64 \
    SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE \
    SENDGRID_FROM_EMAIL=noreply@yourdomain.com \
    SENDGRID_FROM_NAME=YOUR_SENDGRID_FROM_NAME \
    OTP_EXPIRY_SECONDS=300 \
    OTP_MAX_ATTEMPTS=5 \
    RESET_TOKEN_EXPIRY_SECONDS=300 \
    LOCATION_IQ_API_KEY=your_location_iq_api_key \
    VISION_API_URL=http://localhost:8000 \
    VISION_PORT=8000 \
    MINIO_PUBLIC_URL=http://minio:9000 \
    QR_HMAC_SECRET=your_qr_hmac_secret_64_chars_hex \
    ALGOLIA_APP_ID=your_algolia_app_id \
    ALGOLIA_SEARCH_KEY=your_algolia_search_key \
    ALGOLIA_ADMIN_KEY=your_algolia_admin_key \
    POLYGON_RPC_URL=wss://polygon-amoy.infura.io/ws/v3/YOUR_KEY \
    CONTRACT_ADDRESS=your_contract_address

# Start the application
CMD ["node", "dist/src/main.js"]
