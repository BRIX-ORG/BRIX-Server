/*
  Warnings:

  - You are about to drop the column `media_url` on the `bricks` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_url` on the `bricks` table. All the data in the column will be lost.
  - You are about to drop the column `watermark_url` on the `bricks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bricks" DROP COLUMN "media_url",
DROP COLUMN "thumbnail_url",
DROP COLUMN "watermark_url",
ADD COLUMN     "media" JSONB,
ADD COLUMN     "thumbnail" JSONB,
ADD COLUMN     "watermark" JSONB;
