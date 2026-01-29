# Build stage
FROM node:22-alpine AS builder

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
FROM node:22-alpine AS production

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

# Start the application
CMD ["node", "dist/src/main.js"]
