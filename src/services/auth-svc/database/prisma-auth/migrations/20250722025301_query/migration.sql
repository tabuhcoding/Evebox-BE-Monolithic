/*
  Warnings:

  - Added the required column `query` to the `AIAnalyst` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AIAnalyst" ADD COLUMN     "query" TEXT NOT NULL;
