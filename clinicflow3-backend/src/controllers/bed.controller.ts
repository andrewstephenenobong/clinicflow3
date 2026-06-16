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

// GET /api/beds/assignable
// Patients eligible to be admitted to a bed: have been SEEN at least once,
// and are not currently occupying any bed in this clinic.
export async function assignablePatients(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  // Ids of patients currently in a bed (so we can exclude them).
  const occupiedBeds = await prisma.bed.findMany({
    where: { clinicId, patientId: { not: null } },
    select: { patientId: true },
  });
  const occupiedPatientIds = occupiedBeds
    .map((b) => b.patientId)
    .filter((id): id is string => id !== null);

  // Patients in this clinic with at least one SEEN visit, not already in a bed.
  const patients = await prisma.patient.findMany({
    where: {
      clinicId,
      id: { notIn: occupiedPatientIds },
      visits: { some: { clinicId, status: "SEEN" } },
    },
    select: {
      id: true,
      name: true,
      age: true,
      gender: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({ patients });
}

// GET /api/beds/admitted
// Everyone currently occupying a bed, with admission time, for the ward-round
// monitoring view.
export async function admittedPatients(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  const beds = await prisma.bed.findMany({
    where: { clinicId, status: BedStatus.OCCUPIED, patientId: { not: null } },
    include: {
      patient: {
        select: { id: true, name: true, age: true, gender: true, phone: true },
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

// PATCH /api/beds/:id/assign
// Admit a patient to a bed. ADMIN/DOCTOR only. Sets admittedAt.
export async function assignBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;
  const { patientId } = req.body;

  if (req.user!.role !== "ADMIN" && req.user!.role !== "DOCTOR") {
    res.status(403).json({ error: "Only doctors and admins can assign beds" });
    return;
  }

  if (!patientId) {
    res.status(400).json({ error: "patientId is required" });
    return;
  }

  const bed = await prisma.bed.findFirst({ where: { id: bedId, clinicId } });
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }
  if (bed.status === BedStatus.OCCUPIED) {
    res.status(409).json({ error: "Bed is already occupied" });
    return;
  }

  // Confirm the patient belongs to this clinic (multi-tenancy, D6).
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const updated = await prisma.bed.update({
    where: { id: bedId },
    data: {
      status: BedStatus.OCCUPIED,
      patientId,
      admittedAt: new Date(),
    },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  res.json({ bed: updated });
}

// PATCH /api/beds/:id/discharge
// Discharge the patient from a bed. ADMIN/DOCTOR only. Clears admittedAt.
export async function dischargeBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;

  if (req.user!.role !== "ADMIN" && req.user!.role !== "DOCTOR") {
    res.status(403).json({ error: "Only doctors and admins can discharge patients" });
    return;
  }

  const bed = await prisma.bed.findFirst({ where: { id: bedId, clinicId } });
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }

  const updated = await prisma.bed.update({
    where: { id: bedId },
    data: {
      status: BedStatus.AVAILABLE,
      patientId: null,
      admittedAt: null,
    },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  res.json({ bed: updated });
}

// PATCH /api/beds/:id
// Edit bed number / ward (not admission). Status changes here are kept for the
// simple toggle on the Beds page, but admission proper goes through /assign.
export async function updateBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;
  const { bedNumber, ward } = req.body;

  const bed = await prisma.bed.findFirst({ where: { id: bedId, clinicId } });
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }

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
      bedNumber: bedNumber !== undefined ? String(bedNumber).trim() : bed.bedNumber,
      ward: ward !== undefined ? String(ward).trim() : bed.ward,
    },
    include: {
      patient: { select: { id: true, name: true } },
    },
  });

  res.json({ bed: updated });
}

// DELETE /api/beds/:id
export async function removeBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;

  const bed = await prisma.bed.findFirst({ where: { id: bedId, clinicId } });
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }

  await prisma.bed.delete({ where: { id: bedId } });

  res.json({ message: "Bed removed" });
}
