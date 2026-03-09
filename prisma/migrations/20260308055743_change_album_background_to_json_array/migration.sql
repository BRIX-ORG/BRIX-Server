/*
  Warnings:

  - You are about to drop the column `background_color` on the `albums` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "albums" DROP COLUMN "background_color",
ADD COLUMN     "background" JSONB;
