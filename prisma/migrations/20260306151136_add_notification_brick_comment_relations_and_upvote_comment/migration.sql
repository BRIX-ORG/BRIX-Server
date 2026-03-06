-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'UPVOTE_COMMENT';

-- AddForeignKey
ALTER TABLE "notification_groups" ADD CONSTRAINT "notification_groups_brick_id_fkey" FOREIGN KEY ("brick_id") REFERENCES "bricks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_groups" ADD CONSTRAINT "notification_groups_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
