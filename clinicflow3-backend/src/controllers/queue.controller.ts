import type { Response } from "express";
import { prisma } from "../lib/prisma";
import { Triage, VisitStatus } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

// GET /api/queue/today
export async function getTodayQueue(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const visits = await prisma.visit.findMany({
    where: {
      clinicId,
      checkedInAt: { gte: startOfDay, lte: endOfDay },
      status: { in: [VisitStatus.WAITING, VisitStatus.CALLED] },
    },
    include: {
      patient: {
        select: {
          id: true, name: true, age: true, gender: true, phone: true,
        },
      },
    },
    orderBy: { checkedInAt: "asc" },
  });

  const triageOrder: Record<string, number> = {
    EMERGENCY: 0, URGENT: 1, ROUTINE: 2,
  };

  const sorted = [...visits].sort((a, b) => {
    const tA = triageOrder[a.triage] ?? 2;
    const tB = triageOrder[b.triage] ?? 2;
    if (tA !== tB) return tA - tB;
    return new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime();
  });

  res.json({ visits: sorted });
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