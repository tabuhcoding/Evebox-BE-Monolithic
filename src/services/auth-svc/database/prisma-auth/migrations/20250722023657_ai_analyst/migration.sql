-- CreateTable
CREATE TABLE "AIAnalyst" (
    "id" SERIAL NOT NULL,
    "use_for" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "AIAnalyst_pkey" PRIMARY KEY ("id")
);
