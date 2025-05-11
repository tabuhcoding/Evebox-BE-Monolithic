/*
  Warnings:

  - You are about to drop the column `expireAt` on the `PayOSInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PayOSInfo" DROP COLUMN "expireAt",
ADD COLUMN     "expiredAt" TEXT;
