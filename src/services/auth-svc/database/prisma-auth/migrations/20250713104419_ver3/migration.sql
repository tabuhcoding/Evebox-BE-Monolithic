/*
  Warnings:

  - Added the required column `ticket_type_id` to the `TicketTypeRevenue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TicketTypeRevenue" ADD COLUMN     "ticket_type_id" TEXT NOT NULL;
