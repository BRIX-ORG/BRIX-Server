# BRIX Server

[![Pipeline](https://github.com/BRIX-ORG/BRIX-Server/actions/workflows/pipeline.yml/badge.svg)](https://github.com/BRIX-ORG/BRIX-Server/actions/workflows/pipeline.yml)
[![Lint](https://github.com/BRIX-ORG/BRIX-Server/actions/workflows/lint.yml/badge.svg)](https://github.com/BRIX-ORG/BRIX-Server/actions/workflows/lint.yml)
[![Commit Lint](https://github.com/BRIX-ORG/BRIX-Server/actions/workflows/commit-lint.yml/badge.svg)](https://github.com/BRIX-ORG/BRIX-Server/actions/workflows/commit-lint.yml)

BRIX Server is the backend for a location-aware social media platform centered around authenticated media, realtime capture verification, creator interactions, and onchain-connected flows. It handles authentication, media upload pipelines, social graph APIs, chat, notifications, albums, search sync, and blockchain event processing in a single NestJS monolith.

This repository contains the main API, async workers, websocket gateways, Prisma data model, and a small Python vision service used in the realtime photo verification flow.

## Stack Snapshot

![NestJS](https://img.shields.io/badge/NestJS-111827?style=for-the-badge&logo=nestjs&logoColor=E0234E)
![TypeScript](https://img.shields.io/badge/TypeScript-1E3A8A?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-0F172A?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-0F172A?style=for-the-badge&logo=postgresql&logoColor=4169E1)
![Redis](https://img.shields.io/badge/Redis-2B0F12?style=for-the-badge&logo=redis&logoColor=DC382D)
![BullMQ](https://img.shields.io/badge/BullMQ-111827?style=for-the-badge&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-111111?style=for-the-badge&logo=socketdotio&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-2A0F14?style=for-the-badge&logo=minio&logoColor=C72E49)
![Cloudinary](https://img.shields.io/badge/Cloudinary-0B1220?style=for-the-badge&logo=cloudinary&logoColor=3448C5)
![Algolia](https://img.shields.io/badge/Algolia-003DFF?style=for-the-badge&logo=algolia&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-1F2937?style=for-the-badge&logo=firebase&logoColor=FFCA28)
![SendGrid](https://img.shields.io/badge/SendGrid-0F172A?style=for-the-badge&logo=sendgrid&logoColor=white)
![Polygon](https://img.shields.io/badge/Polygon-1F1633?style=for-the-badge&logo=polygon&logoColor=8247E5)
![Docker](https://img.shields.io/badge/Docker-0B1F3A?style=for-the-badge&logo=docker&logoColor=2496ED)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-0F172A?style=for-the-badge&logo=githubactions&logoColor=2088FF)

## What This Backend Covers

- JWT auth, refresh tokens, Google login via Firebase, email verification, and password reset with OTP
- User profiles, avatar/background upload, follow graph, and follow recommendations
- Brick creation for standard art uploads, GLB model posts, and realtime camera uploads
- Realtime photo verification using short-lived signed QR challenges and a Python vision service
- Votes, comments, replies, donations, top authors, and feed-oriented brick queries
- Realtime chat with Socket.IO, typing indicators, presence tracking, reactions, and attachments
- Batched notifications with unread counters and websocket push delivery
- Album creation with image upload and per-album visual metadata
- Wallet linking through signed nonce verification
- Onchain event listening for IPFS distribution, mint confirmation, and donation ingestion
- Algolia sync for users and bricks

## Architecture Notes

- The app is a NestJS monolith, but feature code is split by domain under [`src/modules`](/F:/BRIX-Server/src/modules).
- Each module follows a DDD-style layout with `domain`, `dto`, `application`, `infrastructure`, and controller layers.
- Prisma is the only persistence layer and PostgreSQL is the primary database.
- Redis is used for BullMQ queues, websocket scaling, presence, typing state, and transient verification/session data.
- All HTTP responses are normalized through a global response interceptor into `{ message, code, data }`.
- Swagger docs are exposed at `/docs`, and health checks cover PostgreSQL, Redis, and MinIO.

## Key Backend Flows

### Media Pipeline

- Original files are stored in MinIO
- Public and transformed assets are delivered from Cloudinary
- Description generation and heavy media work run asynchronously through BullMQ

### Realtime Capture Verification

- Client requests a short-lived photo session
- Backend issues an HMAC-signed QR challenge token
- Uploaded webcam image is queued for background processing
- Python vision service decodes the QR from the image
- Backend verifies nonce and timestamp, then marks the brick as verified when valid

### Onchain Sync

- Backend listens to smart contract events over RPC/WebSocket
- `PaidForIPFS`, `BrickCreated`, and `Donated` events are pushed into BullMQ jobs
- Workers update BRIX records, donation history, and websocket status updates for the frontend

### Realtime Delivery

- `/chat` namespace handles presence, rooms, typing indicators, and message events
- `/notifications` pushes notification groups and unread counts
- `/onchain` pushes IPFS and mint status updates back to the owner

## Project Structure

```text
.
|-- .github/workflows/        # CI/CD workflows
|-- prisma/                   # Prisma schema and migrations
|-- python/vision/            # QR decode + image caption helper service
|-- scripts/                  # Utility scripts such as Algolia reindex
|-- src/
|   |-- modules/              # Feature modules (auth, users, bricks, messages, albums, follows, notifications, onchain, wallets)
|   |-- common/               # Guards, decorators, filters, interceptors, strategies
|   |-- prisma/               # Prisma service
|   |-- redis/                # Redis service
|   |-- queue/                # BullMQ queues and processors
|   |-- socket/               # Socket.IO gateways and adapter
|   |-- email/                # SendGrid + MJML email service
|   |-- minio/                # Original file storage
|   |-- cloudinary/           # Optimized and watermarked media delivery
|   |-- algolia/              # Search sync
|   |-- blockchain/           # Smart contract listener
|   |-- firebase/             # Firebase Admin integration
|   |-- location-iq/          # Geocoding endpoints
|   `-- cron/                 # Scheduled jobs
|-- test/                     # E2E tests
|-- docker-compose.yml        # Local development dependencies
|-- Dockerfile                # Production image
`-- package.json              # Scripts and dependencies
```

## Main API Areas

- `auth`: register, login, refresh, logout, Google auth, email verification, password reset
- `users`: profile, avatar/background upload, public user lookup, map locations
- `follows`: follow/unfollow, followers, following, recommendations, top users
- `bricks`: art upload, GLB upload, realtime upload, feeds, comments, votes, top authors
- `messages` and `conversations`: chat, files, reactions, unread counts
- `notifications`: notification feed, unread count, mark-as-read flows
- `albums`: create and manage image-based albums
- `wallets`: nonce generation, signature verification, wallet linking
- `onchain`: donation history and onchain activity for a user

## Local Development

### Prerequisites

- Node.js 22
- pnpm 10
- Docker Desktop

### Install

```bash
pnpm install
```

### Configure Environment

```bash
cp .env.example .env
```

Fill in the external service values you need before running the app.

### Start Local Infrastructure

```bash
docker-compose up -d
```

This brings up PostgreSQL, Redis, MinIO, Redis Commander, the Python vision service, and the NestJS app container.

### Run the API Locally

```bash
pnpm prisma:migrate
pnpm start:dev
```

Default local endpoints:

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`
- MinIO Console: `http://localhost:9001`
- Redis Commander: `http://localhost:8081`

### Useful Commands

```bash
pnpm start:dev
pnpm build
pnpm lint
pnpm format:check
pnpm type-check
pnpm test
pnpm test:e2e
pnpm prisma:migrate
pnpm prisma:generate
pnpm reindex:algolia
```

## Environment Variables

Example config lives in [`.env.example`](/F:/BRIX-Server/.env.example).

### Core Runtime

```env
NODE_ENV=development
APP_PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

### Infrastructure and Integrations

```env
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=

REDIS_HOST=
REDIS_PORT=

MINIO_ENDPOINT=
MINIO_PORT=
MINIO_CONSOLE_PORT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET_NAME=
MINIO_PUBLIC_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=

FIREBASE_SERVICE_ACCOUNT_BASE64=
LOCATION_IQ_API_KEY=

VISION_API_URL=
QR_HMAC_SECRET=

ALGOLIA_APP_ID=
ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=

PINATA_JWT_KEY=
PINATA_GATEWAY=

POLYGON_RPC_URL=
CONTRACT_ADDRESS=
```

## CI/CD

GitHub Actions workflows live in [`.github/workflows`](/F:/BRIX-Server/.github/workflows).

- `lint.yml`
    - installs dependencies
    - runs ESLint, Prettier check, and TypeScript type-checking

- `commit-lint.yml`
    - validates commit messages on push and pull request events

- `pipeline.yml`
    - builds Docker images for the NestJS server and Python vision service
    - pushes versioned images to Docker Hub
    - updates image tags in the BRIX configuration repository for deployment

## Summary

BRIX Server is a social-media backend with stronger media provenance flows than a typical CRUD API. The interesting parts are the realtime photo verification pipeline, the combination of storage and async workers, websocket-driven chat/notification delivery, and the bridge from offchain application data to onchain events.
