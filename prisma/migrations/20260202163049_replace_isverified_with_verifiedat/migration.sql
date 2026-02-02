/*
  Warnings:

  - You are about to drop the column `is_verified` on the `brick_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `is_verified` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "brick_metadata" DROP COLUMN "is_verified",
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_verified",
ADD COLUMN     "verified_at" TIMESTAMP(3);
