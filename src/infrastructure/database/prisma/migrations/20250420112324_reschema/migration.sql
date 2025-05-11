-- AlterTable
ALTER TABLE "EventUserRelationship" ALTER COLUMN "role" DROP NOT NULL;

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

-- AddForeignKey
ALTER TABLE "EventUserRelationship" ADD CONSTRAINT "EventUserRelationship_role_fkey" FOREIGN KEY ("role") REFERENCES "event_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
