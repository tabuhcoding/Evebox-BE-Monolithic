-- CreateEnum
CREATE TYPE "BookingTicketType" AS ENUM ('PHYSICAL_TICKET', 'E_TICKET');

-- CreateEnum
CREATE TYPE "BookingTicketStatus" AS ENUM ('CANCEL', 'SUCCESS', 'PENDING', 'PAID');

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "showingId" TEXT NOT NULL,
    "formResponseId" INTEGER,
    "type" "BookingTicketType" NOT NULL,
    "price" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BookingTicketStatus" NOT NULL,
    "mailSent" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" INTEGER,
    "voucherCodeId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT,
    "description" TEXT NOT NULL,
    "seatId" INTEGER,
    "orderId" INTEGER NOT NULL,
    "ticketTypeId" TEXT,
    "sectionId" INTEGER,
    "isCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedBy" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
