-- CreateTable
CREATE TABLE "Content" (
    "id" SERIAL NOT NULL,
    "context" TEXT NOT NULL,
    "message" TEXT,
    "rootId" INTEGER,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
