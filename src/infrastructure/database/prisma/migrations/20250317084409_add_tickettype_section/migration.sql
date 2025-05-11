-- CreateTable
CREATE TABLE "TicketTypeSection" (
    "ticketTypeId" TEXT NOT NULL,
    "sectionId" INTEGER NOT NULL,

    CONSTRAINT "TicketTypeSection_pkey" PRIMARY KEY ("ticketTypeId","sectionId")
);

-- AddForeignKey
ALTER TABLE "TicketTypeSection" ADD CONSTRAINT "TicketTypeSection_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTypeSection" ADD CONSTRAINT "TicketTypeSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
