/*
  Warnings:

  - Added the required column `seatId` to the `SeatStatus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SeatStatus" ADD COLUMN     "seatId" INTEGER NOT NULL;
