/*
  Warnings:

  - The `orderId` column on the `PaymentInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PaymentInfo" DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER;
