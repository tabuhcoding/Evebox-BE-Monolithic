/*
  Warnings:

  - Added the required column `orderInfoId` to the `TicketQRCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TicketQRCode" ADD COLUMN     "orderInfoId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TicketQRCode" ADD CONSTRAINT "TicketQRCode_orderInfoId_fkey" FOREIGN KEY ("orderInfoId") REFERENCES "OrderInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
