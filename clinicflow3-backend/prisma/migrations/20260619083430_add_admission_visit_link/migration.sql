-- AlterTable
ALTER TABLE "Admission" ADD COLUMN     "visitId" TEXT;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
