-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPLY_COMMENT';

-- AlterTable
ALTER TABLE "brick_metadata" ADD COLUMN     "generated_description" TEXT;

-- CreateTable
CREATE TABLE "brick_votes" (
    "id" UUID NOT NULL,
    "brick_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brick_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "brick_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_votes" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_brick_vote_brick" ON "brick_votes"("brick_id");

-- CreateIndex
CREATE UNIQUE INDEX "brick_votes_brick_id_user_id_key" ON "brick_votes"("brick_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_comment_brick" ON "comments"("brick_id");

-- CreateIndex
CREATE INDEX "idx_comment_vote_comment" ON "comment_votes"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_votes_comment_id_user_id_key" ON "comment_votes"("comment_id", "user_id");

-- AddForeignKey
ALTER TABLE "brick_votes" ADD CONSTRAINT "brick_votes_brick_id_fkey" FOREIGN KEY ("brick_id") REFERENCES "bricks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brick_votes" ADD CONSTRAINT "brick_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_brick_id_fkey" FOREIGN KEY ("brick_id") REFERENCES "bricks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
