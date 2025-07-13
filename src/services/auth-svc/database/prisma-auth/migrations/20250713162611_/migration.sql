/*
  Warnings:

  - You are about to alter the column `total_revenue` on the `EventRevenue` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `total_revenue` on the `OrganizeRevenue` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `total_revenue` on the `Revenue` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `total_revenue` on the `ShowingRevenue` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `total_revenue` on the `TicketTypeRevenue` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "EventRevenue" ALTER COLUMN "total_revenue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "OrganizeRevenue" ALTER COLUMN "total_revenue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Revenue" ALTER COLUMN "total_revenue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "ShowingRevenue" ALTER COLUMN "total_revenue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "TicketTypeRevenue" ALTER COLUMN "total_revenue" SET DATA TYPE INTEGER;
