/*
  Warnings:

  - Added the required column `recipientEmail` to the `TicketTransfer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TicketTransfer" ADD COLUMN     "recipientEmail" TEXT NOT NULL;
