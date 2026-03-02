-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('COMMENT', 'REPLY');

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "images" JSONB,
ADD COLUMN     "type" "CommentType" NOT NULL DEFAULT 'COMMENT';

-- CreateIndex
CREATE INDEX "idx_comment_parent" ON "comments"("parent_id");
