-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deleteAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FormInput" ADD COLUMN     "deleteAt" TIMESTAMP(3);
