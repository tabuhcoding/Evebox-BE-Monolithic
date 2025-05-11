/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `PayOSInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PayOSInfo" DROP COLUMN "expiresAt",
ADD COLUMN     "expireAt" TEXT;
