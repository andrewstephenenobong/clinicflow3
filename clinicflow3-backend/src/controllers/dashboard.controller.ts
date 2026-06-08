import type { Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

// GET /api/dashboard/stats
export async function getStats(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    patientsSeenToday,
    patientsCheckedInToday,
    totalPatients,
    availableBeds,
    totalBeds,
    totalStaff,
  ] = await Promise.all([
    // Patients marked as SEEN today
    prisma.visit.count({
      where: {
        clinicId,
        status: "SEEN",
        checkedInAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // All check-ins today
    prisma.visit.count({
      where: {
        clinicId,
        checkedInAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // Total registered patients
    prisma.patient.count({ where: { clinicId } }),
    // Available beds
    prisma.bed.count({ where: { clinicId, status: "AVAILABLE" } }),
    // Total beds
    prisma.bed.count({ where: { clinicId } }),
    // Total staff
    prisma.user.count({ where: { clinicId } }),
  ]);

  res.json({
    patientsSeenToday,
    patientsCheckedInToday,
    totalPatients,
    availableBeds,
    totalBeds,
    totalStaff,
  });
}
