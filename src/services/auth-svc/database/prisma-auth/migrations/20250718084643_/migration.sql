/*
  Warnings:

  - You are about to drop the column `totalEvents` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AREACODE" AS ENUM ('HANOI', 'HCM_TRUNGTAM', 'HCM_BAC', 'HCM_CONLAI', 'MIENBAC', 'MIENNAM');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "totalEvents";

-- CreateTable
CREATE TABLE "AdminManageEvent" (
    "email" VARCHAR(255) NOT NULL,
    "total_events" INTEGER NOT NULL DEFAULT 0,
    "area_code" "AREACODE" NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminManageEvent_email_key" ON "AdminManageEvent"("email");
