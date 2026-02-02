-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- DropForeignKey
ALTER TABLE "brick_metadata" DROP CONSTRAINT "brick_metadata_brick_id_fkey";

-- DropForeignKey
ALTER TABLE "bricks" DROP CONSTRAINT "bricks_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'OTHER';

-- AddForeignKey
ALTER TABLE "bricks" ADD CONSTRAINT "bricks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brick_metadata" ADD CONSTRAINT "brick_metadata_brick_id_fkey" FOREIGN KEY ("brick_id") REFERENCES "bricks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
