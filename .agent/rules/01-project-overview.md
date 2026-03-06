# Project Overview

BRIX Server is a **NestJS monolith** serving a social and media platform called BRIX. The platform is designed for immutable, GPS/temporally-verified image publishing ("Build Your Truth").

## Core Features handled by the Backend:

- **User Management**: Auth (NextAuth + Firebase), profiles, follows.
- **Bricks**: Publication of "Bricks" (media content: images, 3D/GLTF models, video) with location verification and metadata.
- **Social Interaction**: Voting (up/down), comments, and follows.
- **Real-time Messaging**: 1-on-1 chat with Socket.IO, typing indicators, and online status tracking.
- **Media Processing**: Multi-stage storage (MinIO + Cloudinary), watermarking, and AI-powered vision processing (via a Python sidecar).
- **Background Processing**: BullMQ queues for email, notifications, and heavy media tasks.
- **Discovery**: Location-based queries (PostgreSQL + PostGIS equivalents via Prisma).

## Tech Stack

- **Runtime**: Node.js with NestJS (TypeScript).
- **Database**: PostgreSQL with Prisma ORM.
- **Caching/Real-time**: Redis.
- **Storage**: MinIO (S3-compatible) & Cloudinary.
- **Queues**: BullMQ (backed by Redis).
- **AI/Vision**: Python (FastAPI) sidecar service.
- **Deployment**: Docker/Docker Compose.
