import type { Response } from "express";
import { prisma } from "../lib/prisma";
import { Triage, VisitStatus } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

// GET /api/queue/today
// Returns all OPEN visits (WAITING/CALLED) for the clinic — not just today's.
// A patient checked in on a previous day and never seen still belongs in the
// queue (North Star: never lose a check-in). Each visit is tagged with
// isCarriedOver so the frontend can show today's live arrivals first and
// previous-day leftovers in a separate "carried over" group below.
export async function getTodayQueue(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const visits = await prisma.visit.findMany({
    where: {
      clinicId,
      status: { in: [VisitStatus.WAITING, VisitStatus.CALLED] },
    },
    include: {
      patient: {
        select: {
          id: true, name: true, age: true, gender: true, phone: true,
        },
      },
    },
  });

  const triageOrder: Record<string, number> = {
    EMERGENCY: 0, URGENT: 1, ROUTINE: 2,
  };

  // Tag each visit as carried-over (checked in before today) or not.
  const tagged = visits.map((v) => ({
    ...v,
    isCarriedOver: new Date(v.checkedInAt) < startOfToday,
  }));

  // Sort within a group: triage first, then arrival time.
  const byTriageThenTime = (a: typeof tagged[number], b: typeof tagged[number]) => {
    const tA = triageOrder[a.triage] ?? 2;
    const tB = triageOrder[b.triage] ?? 2;
    if (tA !== tB) return tA - tB;
    return new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime();
  };

  // Today's live arrivals first (sorted), then carried-over leftovers (sorted).
  const todays = tagged.filter((v) => !v.isCarriedOver).sort(byTriageThenTime);
  const carried = tagged.filter((v) => v.isCarriedOver).sort(byTriageThenTime);

  res.json({ visits: [...todays, ...carried] });
}

// POST /api/queue/checkin
export async function checkIn(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const { patientId, reason, triage } = req.body;

  if (!patientId || !reason || !triage) {
    res.status(400).json({ error: "patientId, reason, and triage are required" });
    return;
  }

  const patient = await prisma.patient.findFirst({
    where: { clinicId, id: patientId },
  });

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const visit = await prisma.visit.create({
    data: {
      patientId,
      clinicId,
      reason,
      triage: triage as Triage,
      status: VisitStatus.WAITING,
    },
    include: {
      patient: {
        select: { id: true, name: true, age: true, gender: true, phone: true },
      },
    },
  });

  res.status(201).json({ visit });
}

// PATCH /api/queue/:id/call
export async function callPatient(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const visitId = req.params.id as string;

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
  });

  if (!visit || visit.clinicId !== clinicId) {
    res.status(404).json({ error: "Visit not found" });
    return;
  }

  const updated = await prisma.visit.update({
    where: { id: visitId },
    data: {
      status: VisitStatus.CALLED,
      calledAt: new Date(),
    },
    include: {
      patient: {
        select: { id: true, name: true, age: true, gender: true, phone: true },
      },
    },
  });

  res.json({ visit: updated });
}

// PATCH /api/queue/:id/seen
export async function markSeen(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const visitId = req.params.id as string;
  const { notes } = req.body;

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
  });

  if (!visit || visit.clinicId !== clinicId) {
    res.status(404).json({ error: "Visit not found" });
    return;
  }

  const updated = await prisma.visit.update({
    where: { id: visitId },
    data: {
      status: VisitStatus.SEEN,
      notes: notes ?? null,
      seenByUserId: req.user!.userId,
      seenAt: new Date(),
    },
    include: {
      patient: {
        select: { id: true, name: true, age: true, gender: true, phone: true },
      },
    },
  });

  res.json({ visit: updated });
}