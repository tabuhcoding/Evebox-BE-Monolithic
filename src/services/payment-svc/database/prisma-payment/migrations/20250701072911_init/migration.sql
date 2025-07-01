-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYOS', 'MOMO');

-- CreateTable
CREATE TABLE "PayOSInfo" (
    "orderCode" INTEGER NOT NULL,
    "bin" VARCHAR(20),
    "accountNumber" VARCHAR(50),
    "accountName" VARCHAR(100),
    "amount" INTEGER NOT NULL,
    "description" VARCHAR(100),
    "currency" VARCHAR(10),
    "paymentLinkId" VARCHAR(50),
    "status" VARCHAR(20),
    "checkoutUrl" TEXT,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TEXT
);

-- CreateTable
CREATE TABLE "PaymentInfo" (
    "id" SERIAL NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paymentCode" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "orderId" INTEGER,

    CONSTRAINT "PaymentInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethodStatus" (
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "PayOSInfo_orderCode_key" ON "PayOSInfo"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethodStatus_paymentMethod_key" ON "PaymentMethodStatus"("paymentMethod");
