/*
  Warnings:

  - You are about to drop the column `orderInfoId` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `orderInfoId` on the `TicketQRCode` table. All the data in the column will be lost.
  - Added the required column `showingId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketId` to the `TicketQRCode` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_orderInfoId_fkey";

-- DropForeignKey
ALTER TABLE "TicketQRCode" DROP CONSTRAINT "TicketQRCode_orderInfoId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "orderInfoId",
ADD COLUMN     "showingId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "TicketQRCode" DROP COLUMN "orderInfoId",
ADD COLUMN     "seatId" INTEGER,
ADD COLUMN     "ticketId" TEXT NOT NULL,
ADD COLUMN     "ticketTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "TicketQRCode" ADD CONSTRAINT "TicketQRCode_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_showingId_fkey" FOREIGN KEY ("showingId") REFERENCES "Showing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
