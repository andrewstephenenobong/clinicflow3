import type { Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

// GET /api/patients
export async function getPatients(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  const patients = await prisma.patient.findMany({
    where: { clinicId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      age: true,
      gender: true,
      phone: true,
      createdAt: true,
    },
  });

  res.json({ patients });
}

// GET /api/patients/:id
export async function getPatient(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const patientId = req.params.id as string;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      visits: {
        where: { clinicId },
        orderBy: { checkedInAt: "desc" },
        select: {
          id: true,
          reason: true,
          triage: true,
          status: true,
          notes: true,
          checkedInAt: true,
          seenAt: true,
        },
      },
    },
  });

  if (!patient || patient.clinicId !== clinicId) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.json({ patient });
}

// POST /api/patients
export async function createPatient(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const { name, age, gender, phone } = req.body;

  if (!name || !age || !gender) {
    res.status(400).json({ error: "name, age, and gender are required" });
    return;
  }

  const patient = await prisma.patient.create({
    data: {
      clinicId,
      name,
      age: parseInt(age),
      gender,
      phone: phone ?? null,
    },
  });

  res.status(201).json({ patient });
}
