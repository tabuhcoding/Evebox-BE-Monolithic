/*
  Warnings:

  - Made the column `eventId` on table `OrgPaymentInfo` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OrgPaymentInfo" ALTER COLUMN "eventId" SET NOT NULL;
