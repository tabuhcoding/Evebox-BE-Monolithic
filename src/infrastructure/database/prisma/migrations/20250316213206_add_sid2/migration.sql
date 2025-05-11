/*
  Warnings:

  - Changed the type of `seatMapId` on the `SeatStatus` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "SeatStatus" DROP COLUMN "seatMapId",
ADD COLUMN     "seatMapId" INTEGER NOT NULL;
