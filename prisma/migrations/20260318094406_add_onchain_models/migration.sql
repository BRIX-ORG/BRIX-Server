/*
  Warnings:

  - A unique constraint covering the columns `[wallet_address]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `brick_metadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "brick_metadata" ADD COLUMN     "contract_address" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image_cid" TEXT,
ADD COLUMN     "ipfs_cid" TEXT,
ADD COLUMN     "nonce" TEXT,
ADD COLUMN     "on_chain_status" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill updated_at and remove default (Prisma manages this via application)
ALTER TABLE "brick_metadata" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "wallet_address" TEXT;

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL,
    "brick_id" UUID NOT NULL,
    "from_address" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "on_chain_activities" (
    "id" UUID NOT NULL,
    "brick_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "gas_used" DECIMAL(18,8),
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "on_chain_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donations_tx_hash_key" ON "donations"("tx_hash");

-- CreateIndex
CREATE INDEX "donations_brick_id_idx" ON "donations"("brick_id");

-- CreateIndex
CREATE INDEX "on_chain_activities_brick_id_idx" ON "on_chain_activities"("brick_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_brick_id_fkey" FOREIGN KEY ("brick_id") REFERENCES "bricks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
