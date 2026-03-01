/*
  Warnings:

  - You are about to drop the column `generated_description` on the `brick_metadata` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "brick_metadata" DROP COLUMN "generated_description";

-- AlterTable
ALTER TABLE "bricks" ADD COLUMN     "generated_description" TEXT;
