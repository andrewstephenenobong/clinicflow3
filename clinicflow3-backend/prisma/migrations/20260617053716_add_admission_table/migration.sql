-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bedId" TEXT,
    "bedNumber" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admittedByUserId" TEXT,
    "admissionNote" TEXT,
    "dischargedAt" TIMESTAMP(3),
    "dischargedByUserId" TEXT,
    "dischargeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Admission_clinicId_idx" ON "Admission"("clinicId");

-- CreateIndex
CREATE INDEX "Admission_clinicId_patientId_idx" ON "Admission"("clinicId", "patientId");

-- CreateIndex
CREATE INDEX "Admission_clinicId_dischargedAt_idx" ON "Admission"("clinicId", "dischargedAt");

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
