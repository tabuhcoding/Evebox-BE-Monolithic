/*
  Warnings:

  - You are about to drop the column `status` on the `Showing` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Events" ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "locationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Showing" DROP COLUMN "status";
