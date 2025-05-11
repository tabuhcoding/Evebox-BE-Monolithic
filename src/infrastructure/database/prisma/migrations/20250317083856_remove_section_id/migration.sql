/*
  Warnings:

  - You are about to drop the column `sectionId` on the `TicketType` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TicketType" DROP CONSTRAINT "TicketType_sectionId_fkey";

-- AlterTable
ALTER TABLE "TicketType" DROP COLUMN "sectionId";
