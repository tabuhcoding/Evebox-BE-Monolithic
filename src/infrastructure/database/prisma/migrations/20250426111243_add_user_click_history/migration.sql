-- CreateTable
CREATE TABLE "user_click_history" (
    "id" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_click_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_click_history" ADD CONSTRAINT "user_click_history_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
