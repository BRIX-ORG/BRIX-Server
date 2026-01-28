-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'GLTF', 'VIDEO');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('REALTIME', 'ART', 'PRODUCT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "background" TEXT,
    "address" TEXT,
    "short_description" TEXT,
    "trust_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bricks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "media_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "watermark_url" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "media_type" "MediaType" NOT NULL,
    "tag_type" "TagType",
    "address" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bricks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brick_metadata" (
    "id" UUID NOT NULL,
    "brick_id" UUID NOT NULL,
    "raw_exif" JSONB,
    "model_data" JSONB,
    "hash_sha256" TEXT,
    "on_chain_tx" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "brick_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brick_metadata_brick_id_key" ON "brick_metadata"("brick_id");

-- AddForeignKey
ALTER TABLE "bricks" ADD CONSTRAINT "bricks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brick_metadata" ADD CONSTRAINT "brick_metadata_brick_id_fkey" FOREIGN KEY ("brick_id") REFERENCES "bricks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
