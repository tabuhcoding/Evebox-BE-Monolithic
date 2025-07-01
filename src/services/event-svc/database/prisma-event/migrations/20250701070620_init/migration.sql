-- CreateEnum
CREATE TYPE "OTPType" AS ENUM ('FORGOT_PASSWORD', 'REGISTER');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('EVENT', 'ORG');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYOS', 'MOMO');

-- CreateEnum
CREATE TYPE "BookingTicketType" AS ENUM ('PHYSICAL_TICKET', 'E_TICKET');

-- CreateEnum
CREATE TYPE "BookingTicketStatus" AS ENUM ('CANCEL', 'SUCCESS', 'PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "SeatStatusEnum" AS ENUM ('NOTSALE', 'AVAILABLE', 'SOLD', 'INCACHE', 'ESOLD');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'VALUE');

-- CreateEnum
CREATE TYPE "CreatorRole" AS ENUM ('ADMIN', 'ORG');

-- CreateEnum
CREATE TYPE "TicketTypeStatus" AS ENUM ('SOLD_OUT', 'REGISTER_NOW', 'BOOK_NOW', 'REGISTER_CLOSED', 'SALE_CLOSED', 'NOT_OPEN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SYSTEM_ADMIN', 'ADMIN', 'ORGANIZER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "TicketDeliveryType" AS ENUM ('PHYSICAL_TICKET', 'E_TICKET');

-- CreateTable
CREATE TABLE "province" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "provinceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "ward" VARCHAR(100) NOT NULL,
    "districtId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "deleteAt" TIMESTAMP(3),

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormAnswer" (
    "id" SERIAL NOT NULL,
    "formResponseId" INTEGER NOT NULL,
    "formInputId" INTEGER NOT NULL,
    "value" TEXT,

    CONSTRAINT "FormAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormInput" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "fieldName" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "regex" TEXT,
    "options" JSONB,
    "deleteAt" TIMESTAMP(3),

    CONSTRAINT "FormInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "showingId" TEXT,
    "orderId" INTEGER,

    CONSTRAINT "FormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Row" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rowId" INTEGER NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "seatmapId" INTEGER NOT NULL,
    "isStage" BOOLEAN NOT NULL,
    "element" JSONB NOT NULL,
    "attribute" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReservingSeat" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seatmap" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewBox" TEXT NOT NULL,
    "status" INTEGER NOT NULL,

    CONSTRAINT "Seatmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatStatus" (
    "id" TEXT NOT NULL,
    "showingId" TEXT NOT NULL,
    "status" "SeatStatusEnum" NOT NULL,
    "seatId" INTEGER NOT NULL,
    "seatMapId" INTEGER NOT NULL,

    CONSTRAINT "SeatStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTypeSection" (
    "ticketTypeId" TEXT NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "TicketTypeSection_pkey" PRIMARY KEY ("ticketTypeId","sectionId")
);

-- CreateTable
CREATE TABLE "VoucherCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "creatorRole" "CreatorRole" NOT NULL,
    "organizerId" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxDiscountValue" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "eventId" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherCode" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "maxUsage" INTEGER NOT NULL DEFAULT 0,
    "maxUsagePerUser" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VoucherCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherTargetUser" (
    "id" TEXT NOT NULL,
    "voucherCodeId" TEXT NOT NULL,
    "userId" VARCHAR(255) NOT NULL,

    CONSTRAINT "VoucherTargetUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCategories" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Events" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "organizerId" TEXT,
    "locationId" INTEGER,
    "imgLogoUrl" TEXT,
    "imgPosterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minTicketPrice" INTEGER,
    "nearlyStartDate" TIMESTAMP(3),
    "nearlyEndDate" TIMESTAMP(3),
    "isOnlyOnEve" BOOLEAN NOT NULL DEFAULT false,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "lastScore" DECIMAL(10,2) NOT NULL,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "weekClicks" INTEGER NOT NULL DEFAULT 0,
    "venue" VARCHAR(100),
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "orgDescription" TEXT,
    "orgName" TEXT,
    "deleteAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Showing" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" INTEGER NOT NULL,
    "isFree" BOOLEAN NOT NULL,
    "minTicketPrice" INTEGER,
    "isSalable" BOOLEAN NOT NULL,
    "isPresale" BOOLEAN NOT NULL,
    "seatMapId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isEnabledQueueWaiting" BOOLEAN NOT NULL,
    "showAllSeats" BOOLEAN NOT NULL,
    "formId" INTEGER,
    "deleteAt" TIMESTAMP(3),

    CONSTRAINT "Showing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "showingId" TEXT NOT NULL,
    "status" "TicketTypeStatus" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL,
    "price" INTEGER NOT NULL,
    "originalPrice" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "maxQtyPerOrder" INTEGER NOT NULL,
    "minQtyPerOrder" INTEGER NOT NULL,
    "deliveryType" "TicketDeliveryType" NOT NULL DEFAULT 'E_TICKET',
    "autoSendMail" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER DEFAULT 0,
    "deleteAt" TIMESTAMP(3),

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_payment_infor" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "businessType" INTEGER NOT NULL,
    "fullName" TEXT,
    "address" TEXT,
    "taxCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "org_payment_infor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventUserRelationship" (
    "eventId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" INTEGER,
    "role_desc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EventUserRelationship_pkey" PRIMARY KEY ("eventId","userId")
);

-- CreateTable
CREATE TABLE "event_role" (
    "id" INTEGER NOT NULL,
    "isEdited" BOOLEAN NOT NULL,
    "isSummarized" BOOLEAN NOT NULL,
    "viewVoucher" BOOLEAN NOT NULL,
    "marketing" BOOLEAN NOT NULL,
    "viewOrder" BOOLEAN NOT NULL,
    "viewSeatmap" BOOLEAN NOT NULL,
    "viewMember" BOOLEAN NOT NULL,
    "checkin" BOOLEAN NOT NULL,
    "checkout" BOOLEAN NOT NULL,
    "redeem" BOOLEAN NOT NULL,

    CONSTRAINT "event_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_click_history" (
    "id" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_click_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormAnswer" ADD CONSTRAINT "FormAnswer_formInputId_fkey" FOREIGN KEY ("formInputId") REFERENCES "FormInput"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormAnswer" ADD CONSTRAINT "FormAnswer_formResponseId_fkey" FOREIGN KEY ("formResponseId") REFERENCES "FormResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormInput" ADD CONSTRAINT "FormInput_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_showingId_fkey" FOREIGN KEY ("showingId") REFERENCES "Showing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Row" ADD CONSTRAINT "Row_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "Row"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_seatmapId_fkey" FOREIGN KEY ("seatmapId") REFERENCES "Seatmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatStatus" ADD CONSTRAINT "SeatStatus_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatStatus" ADD CONSTRAINT "SeatStatus_showingId_fkey" FOREIGN KEY ("showingId") REFERENCES "Showing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTypeSection" ADD CONSTRAINT "TicketTypeSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTypeSection" ADD CONSTRAINT "TicketTypeSection_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherCode" ADD CONSTRAINT "VoucherCode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "VoucherCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherTargetUser" ADD CONSTRAINT "VoucherTargetUser_voucherCodeId_fkey" FOREIGN KEY ("voucherCodeId") REFERENCES "VoucherCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCategories" ADD CONSTRAINT "EventCategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCategories" ADD CONSTRAINT "EventCategories_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Showing" ADD CONSTRAINT "Showing_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Showing" ADD CONSTRAINT "Showing_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Showing" ADD CONSTRAINT "Showing_seatMapId_fkey" FOREIGN KEY ("seatMapId") REFERENCES "Seatmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_showingId_fkey" FOREIGN KEY ("showingId") REFERENCES "Showing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUserRelationship" ADD CONSTRAINT "EventUserRelationship_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventUserRelationship" ADD CONSTRAINT "EventUserRelationship_role_fkey" FOREIGN KEY ("role") REFERENCES "event_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_click_history" ADD CONSTRAINT "user_click_history_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
