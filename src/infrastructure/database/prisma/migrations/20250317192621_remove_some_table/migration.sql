/*
  Warnings:

  - You are about to drop the `otps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `province` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_provinces` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FormResponse" DROP CONSTRAINT "FormResponse_userId_fkey";

-- DropForeignKey
ALTER TABLE "districts" DROP CONSTRAINT "districts_provinceId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_email_fkey";

-- DropForeignKey
ALTER TABLE "user_provinces" DROP CONSTRAINT "user_provinces_provinceId_fkey";

-- DropForeignKey
ALTER TABLE "user_provinces" DROP CONSTRAINT "user_provinces_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";

-- DropTable
DROP TABLE "otps";

-- DropTable
DROP TABLE "province";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "role";

-- DropTable
DROP TABLE "user_provinces";

-- DropTable
DROP TABLE "users";
