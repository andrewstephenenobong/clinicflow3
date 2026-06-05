import type { Response } from "express";
import { prisma } from "../lib/prisma";
import { BedStatus } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

// GET /api/beds
export async function getBeds(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  const beds = await prisma.bed.findMany({
    where: { clinicId },
    include: {
      patient: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ ward: "asc" }, { bedNumber: "asc" }],
  });

  res.json({ beds });
}

// PATCH /api/beds/:id
export async function updateBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;
  const { status, patientId } = req.body;

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
  });

  if (!bed || bed.clinicId !== clinicId) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }

  const updated = await prisma.bed.update({
    where: { id: bedId },
    data: {
      status: status as BedStatus,
      patientId: status === BedStatus.AVAILABLE ? null : (patientId ?? bed.patientId),
    },
    include: {
      patient: {
        select: { id: true, name: true },
      },
    },
  });

  res.json({ bed: updated });
}
