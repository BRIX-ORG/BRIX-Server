/*
  Warnings:

  - You are about to drop the column `wallet_address` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_wallet_address_key";

-- AlterTable
ALTER TABLE "brick_metadata" ADD COLUMN     "on_chain_id" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "wallet_address",
ADD COLUMN     "wallet_nonce" TEXT;

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
