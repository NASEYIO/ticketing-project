/*
  Warnings:

  - You are about to drop the column `qrHash` on the `Ticket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[secretCode]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `secretCode` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_orderId_idx";

-- DropIndex
DROP INDEX "Ticket_qrHash_idx";

-- DropIndex
DROP INDEX "Ticket_qrHash_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "tierId" TEXT;

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "qrHash",
ADD COLUMN     "secretCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_secretCode_key" ON "Ticket"("secretCode");

-- CreateIndex
CREATE INDEX "Ticket_secretCode_idx" ON "Ticket"("secretCode");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
