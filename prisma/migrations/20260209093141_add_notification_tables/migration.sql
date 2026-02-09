/*
  Warnings:

  - The `address` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE_BRICK', 'COMMENT_BRICK', 'FOLLOW');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "address",
ADD COLUMN     "address" JSONB;

-- CreateTable
CREATE TABLE "follows" (
    "follower_id" UUID NOT NULL,
    "following_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id","following_id")
);

-- CreateTable
CREATE TABLE "notification_groups" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "brick_id" UUID,
    "comment_id" UUID,
    "actors_count" INTEGER NOT NULL DEFAULT 1,
    "last_actor_id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_actors" (
    "id" UUID NOT NULL,
    "notification_group_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_actors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_follows_following" ON "follows"("following_id");

-- CreateIndex
CREATE INDEX "idx_notification_group_aggregate" ON "notification_groups"("recipient_id", "type", "brick_id", "comment_id", "updated_at");

-- CreateIndex
CREATE INDEX "idx_notification_feed" ON "notification_groups"("recipient_id", "is_read", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_actors_notification_group_id_actor_id_key" ON "notification_actors"("notification_group_id", "actor_id");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_groups" ADD CONSTRAINT "notification_groups_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_groups" ADD CONSTRAINT "notification_groups_last_actor_id_fkey" FOREIGN KEY ("last_actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_actors" ADD CONSTRAINT "notification_actors_notification_group_id_fkey" FOREIGN KEY ("notification_group_id") REFERENCES "notification_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_actors" ADD CONSTRAINT "notification_actors_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
