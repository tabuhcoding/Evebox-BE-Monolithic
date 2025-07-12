-- CreateTable
CREATE TABLE "Revenue" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_revenue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizeRevenue" (
    "id" SERIAL NOT NULL,
    "revenue_id" INTEGER NOT NULL,
    "org_id" TEXT NOT NULL,
    "org_name" TEXT,
    "total_revenue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrganizeRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRevenue" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "event_name" TEXT,
    "total_revenue" INTEGER NOT NULL,

    CONSTRAINT "EventRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowingRevenue" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "showing_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_revenue" INTEGER NOT NULL,

    CONSTRAINT "ShowingRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketTypeRevenue" (
    "id" SERIAL NOT NULL,
    "showing_id" INTEGER NOT NULL,
    "name" TEXT,
    "price" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" INTEGER NOT NULL,

    CONSTRAINT "TicketTypeRevenue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrganizeRevenue" ADD CONSTRAINT "OrganizeRevenue_revenue_id_fkey" FOREIGN KEY ("revenue_id") REFERENCES "Revenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRevenue" ADD CONSTRAINT "EventRevenue_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "OrganizeRevenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowingRevenue" ADD CONSTRAINT "ShowingRevenue_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "EventRevenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketTypeRevenue" ADD CONSTRAINT "TicketTypeRevenue_showing_id_fkey" FOREIGN KEY ("showing_id") REFERENCES "ShowingRevenue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
