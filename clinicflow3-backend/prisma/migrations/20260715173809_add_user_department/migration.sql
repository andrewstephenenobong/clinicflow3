-- AlterTable
ALTER TABLE "Admission" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Bed" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "department" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "deletedAt" TIMESTAMP(3);
