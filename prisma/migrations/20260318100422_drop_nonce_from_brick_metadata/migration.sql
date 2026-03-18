/*
  Warnings:

  - You are about to drop the column `nonce` on the `brick_metadata` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "brick_metadata" DROP COLUMN "nonce";
