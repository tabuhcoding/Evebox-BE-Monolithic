/*
  Warnings:

  - You are about to drop the column `quantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `seatId` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "quantity",
DROP COLUMN "seatId";

-- AlterTable
ALTER TABLE "TicketTypeSection" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 20;
