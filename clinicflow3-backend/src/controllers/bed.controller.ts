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
      patient: { select: { id: true, name: true } },
    },
    orderBy: [{ ward: "asc" }, { bedNumber: "asc" }],
  });

  res.json({ beds });
}

// GET /api/beds/assignable
// A patient is assignable only if they have a SEEN visit that has NOT already
// been consumed by an admission. Every admission permanently "uses up" the
// visit that led to it (Admission.visitId). So once a patient is admitted —
// and even after they are discharged — that SEEN visit is spent, and they are
// not assignable again until a FRESH check-in -> seen produces a new, unconsumed
// SEEN visit. This is what makes discharge final.
export async function assignablePatients(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  // Every visitId already consumed by an admission in this clinic.
  const consumed = await prisma.admission.findMany({
    where: { clinicId, visitId: { not: null } },
    select: { visitId: true },
  });
  const consumedVisitIds = consumed
    .map((a) => a.visitId)
    .filter((id): id is string => id !== null);

  // Patients who have at least one SEEN visit whose id is NOT consumed.
  const patients = await prisma.patient.findMany({
    where: {
      clinicId,
      visits: {
        some: { clinicId, status: "SEEN", id: { notIn: consumedVisitIds } },
      },
    },
    select: {
      id: true, name: true, age: true, gender: true, phone: true,
    },
    orderBy: { name: "asc" },
  });

  res.json({ patients });
}

// GET /api/beds/admitted
// Everyone currently occupying a bed, with admission time, for the ward round.
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
    include: { patient: { select: { id: true, name: true } } },
  });

  res.status(201).json({ bed });
}

// PATCH /api/beds/:id/assign
// Admit a patient. ADMIN/DOCTOR only. Sets bed state AND opens an Admission row,
// recording which SEEN visit this admission consumes.
export async function assignBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;
  const { patientId, admissionNote } = req.body;

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

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  // Guard against double-admission: a patient with an OPEN admission cannot be
  // admitted to another bed. Enforced on the action, not just the list.
  const existingOpen = await prisma.admission.findFirst({
    where: { clinicId, patientId, dischargedAt: null },
  });
  if (existingOpen) {
    res.status(409).json({
      error: `${patient.name} is already admitted to bed ${existingOpen.bedNumber}. Discharge them first.`,
    });
    return;
  }

  // Find a SEEN visit that has NOT already been consumed by an admission. This
  // is the visit this admission will "use up". If there is none, the patient is
  // not eligible — they need a fresh check-in -> seen cycle. (Belt-and-suspenders:
  // the assignable list already enforces this, but the action guards itself too.)
  const consumed = await prisma.admission.findMany({
    where: { clinicId, patientId, visitId: { not: null } },
    select: { visitId: true },
  });
  const consumedVisitIds = consumed
    .map((a) => a.visitId)
    .filter((id): id is string => id !== null);

  const eligibleVisit = await prisma.visit.findFirst({
    where: { clinicId, patientId, status: "SEEN", id: { notIn: consumedVisitIds } },
    orderBy: { seenAt: "desc" },
  });

  if (!eligibleVisit) {
    res.status(409).json({
      error: `${patient.name} must be checked in and seen by a doctor before being admitted again.`,
    });
    return;
  }

  const now = new Date();

  // Update bed AND open an admission record together, so they can't drift apart.
  // The admission records the visit it consumes.
  const [updated] = await prisma.$transaction([
    prisma.bed.update({
      where: { id: bedId },
      data: { status: BedStatus.OCCUPIED, patientId, admittedAt: now },
      include: { patient: { select: { id: true, name: true } } },
    }),
    prisma.admission.create({
      data: {
        clinicId,
        patientId,
        visitId: eligibleVisit.id,
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        ward: bed.ward,
        admittedAt: now,
        admittedByUserId: req.user!.userId,
        admissionNote: admissionNote ? String(admissionNote).trim() : null,
      },
    }),
  ]);

  res.json({ bed: updated });
}

// PATCH /api/beds/:id/discharge
// Discharge. ADMIN/DOCTOR only. Clears the bed AND closes the open Admission row.
export async function dischargeBed(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const bedId = req.params.id as string;
  const { dischargeNote } = req.body;

  if (req.user!.role !== "ADMIN" && req.user!.role !== "DOCTOR") {
    res.status(403).json({ error: "Only doctors and admins can discharge patients" });
    return;
  }

  const bed = await prisma.bed.findFirst({ where: { id: bedId, clinicId } });
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }

  const now = new Date();

  // Find the open admission for the patient currently in this bed (if any).
  const openAdmission = bed.patientId
    ? await prisma.admission.findFirst({
        where: { clinicId, patientId: bed.patientId, bedId: bed.id, dischargedAt: null },
        orderBy: { admittedAt: "desc" },
      })
    : null;

  const ops: any[] = [
    prisma.bed.update({
      where: { id: bedId },
      data: { status: BedStatus.AVAILABLE, patientId: null, admittedAt: null },
      include: { patient: { select: { id: true, name: true } } },
    }),
  ];

  if (openAdmission) {
    ops.push(
      prisma.admission.update({
        where: { id: openAdmission.id },
        data: {
          dischargedAt: now,
          dischargedByUserId: req.user!.userId,
          dischargeNote: dischargeNote ? String(dischargeNote).trim() : null,
        },
      })
    );
  }

  const [updated] = await prisma.$transaction(ops);

  res.json({ bed: updated });
}

// GET /api/patients/:id/admissions  (mounted under beds router as /admissions/:patientId)
// Admission history for one patient, newest first.
export async function patientAdmissions(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const patientId = req.params.patientId as string;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const admissions = await prisma.admission.findMany({
    where: { clinicId, patientId },
    orderBy: { admittedAt: "desc" },
  });

  res.json({ admissions });
}

// PATCH /api/beds/:id  — edit bed number / ward only
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
    include: { patient: { select: { id: true, name: true } } },
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
