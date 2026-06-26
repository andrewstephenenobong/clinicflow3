-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Patient_clinicId_dateOfBirth_idx" ON "Patient"("clinicId", "dateOfBirth");
