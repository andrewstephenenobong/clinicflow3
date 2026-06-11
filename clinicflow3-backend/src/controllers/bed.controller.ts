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

// POST /api/beds
export async function createBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const { bedNumber, ward } = req.body;

  if (!bedNumber || !ward) {
    res.status(400).json({ error: "bedNumber and ward are required" });
    return;
  }

  // Schema has @@unique([clinicId, bedNumber]) — guard against duplicates
  // with a friendly message instead of letting Prisma throw a raw P2002.
  const existing = await prisma.bed.findFirst({
    where: { clinicId, bedNumber: String(bedNumber).trim() },
  });

  if (existing) {
    res.status(409).json({ error: `Bed ${bedNumber} already exists` });
    return;
  }

  const bed = await prisma.bed.create({
    data: {
      clinicId,
      bedNumber: String(bedNumber).trim(),
      ward: String(ward).trim(),
      status: BedStatus.AVAILABLE,
    },
    include: {
      patient: {
        select: { id: true, name: true },
      },
    },
  });

  res.status(201).json({ bed });
}

// PATCH /api/beds/:id
export async function updateBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;
  const { status, patientId, bedNumber, ward } = req.body;

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
  });

  if (!bed || bed.clinicId !== clinicId) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }

  // If renaming, guard the unique constraint against another bed in this clinic.
  if (bedNumber !== undefined && String(bedNumber).trim() !== bed.bedNumber) {
    const clash = await prisma.bed.findFirst({
      where: { clinicId, bedNumber: String(bedNumber).trim() },
    });
    if (clash) {
      res.status(409).json({ error: `Bed ${bedNumber} already exists` });
      return;
    }
  }

  const updated = await prisma.bed.update({
    where: { id: bedId },
    data: {
      // status only changes if provided; otherwise keep current
      status: status !== undefined ? (status as BedStatus) : bed.status,
      patientId:
        status === BedStatus.AVAILABLE
          ? null
          : status !== undefined
          ? (patientId ?? bed.patientId)
          : bed.patientId,
      bedNumber: bedNumber !== undefined ? String(bedNumber).trim() : bed.bedNumber,
      ward: ward !== undefined ? String(ward).trim() : bed.ward,
    },
    include: {
      patient: {
        select: { id: true, name: true },
      },
    },
  });

  res.json({ bed: updated });
}

// DELETE /api/beds/:id
export async function removeBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
  });

  if (!bed || bed.clinicId !== clinicId) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }

  await prisma.bed.delete({ where: { id: bedId } });

  res.json({ message: "Bed removed" });
}
