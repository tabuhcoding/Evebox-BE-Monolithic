-- CreateTable
CREATE TABLE "UserPin" (
    "id" SERIAL NOT NULL,
    "userEmail" VARCHAR(255) NOT NULL,
    "hashedPin" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPin_userEmail_key" ON "UserPin"("userEmail");

-- AddForeignKey
ALTER TABLE "UserPin" ADD CONSTRAINT "UserPin_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
