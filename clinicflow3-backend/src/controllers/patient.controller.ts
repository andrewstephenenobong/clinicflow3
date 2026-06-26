import type { Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

// Helper: compute current age in years from a date of birth.
// This is the source of truth for age — never the stored int, when DOB exists.
function computeAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// GET /api/patients/search?q=<name>
// Live patient search for the check-in matching flow. Returns up to 10 patients
// in this clinic whose name contains the query (case-insensitive, min 2 chars).
// MUST be mounted BEFORE /:id in the router or "search" gets swallowed as an id.
export async function searchPatients(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const q = String(req.query.q ?? "").trim();

  // Don't search on fewer than 2 characters — too many results, too slow.
  if (q.length < 2) {
    res.json({ patients: [] });
    return;
  }

  const patients = await prisma.patient.findMany({
    where: {
      clinicId,
      name: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      age: true,
      dateOfBirth: true,
      gender: true,
      phone: true,
    },
    orderBy: { name: "asc" },
    take: 10,
  });

  // Compute live age from DOB where available so stale stored age is never shown.
  const result = patients.map((p) => ({
    ...p,
    age: p.dateOfBirth ? computeAge(p.dateOfBirth) : p.age,
  }));

  res.json({ patients: result });
}

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
      dateOfBirth: true,
      gender: true,
      phone: true,
      createdAt: true,
    },
  });

  const result = patients.map((p) => ({
    ...p,
    age: p.dateOfBirth ? computeAge(p.dateOfBirth) : p.age,
  }));

  res.json({ patients: result });
}

// GET /api/patients/:id
export async function getPatient(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const patientId = req.params.id as string;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
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

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.json({
    patient: {
      ...patient,
      age: patient.dateOfBirth ? computeAge(patient.dateOfBirth) : patient.age,
    },
  });
}

// POST /api/patients
// Now accepts dateOfBirth (preferred) or age (legacy fallback).
// When dateOfBirth is provided, age is computed from it and kept in sync
// so all existing code reading patient.age still gets a correct value.
export async function createPatient(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const { name, dateOfBirth, age, gender, phone } = req.body;

  if (!name || !gender) {
    res.status(400).json({ error: "name and gender are required" });
    return;
  }
  if (!dateOfBirth && !age) {
    res.status(400).json({ error: "dateOfBirth or age is required" });
    return;
  }

  let dob: Date | null = null;
  let storedAge: number;

  if (dateOfBirth) {
    dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      res.status(400).json({ error: "Invalid dateOfBirth — use YYYY-MM-DD format" });
      return;
    }
    storedAge = computeAge(dob);
  } else {
    storedAge = parseInt(age);
  }

  const patient = await prisma.patient.create({
    data: {
      clinicId,
      name,
      age: storedAge,
      dateOfBirth: dob,
      gender,
      phone: phone ?? null,
    },
  });

  res.status(201).json({ patient });
}

// PATCH /api/patients/:id
// Edit a patient's clinical/contact details. Only a whitelisted set of fields
// can be changed — never id or clinicId. D6-safe: findFirst scoped by clinicId.
export async function updatePatient(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const patientId = req.params.id as string;
  const { phone, address, nextOfKin, bloodGroup, allergies, chronicConditions } = req.body;

  const existing = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
  });

  if (!existing) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const clean = (v: unknown) =>
    v === undefined ? undefined : v === "" ? null : String(v).trim();

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      phone: clean(phone),
      address: clean(address),
      nextOfKin: clean(nextOfKin),
      bloodGroup: clean(bloodGroup),
      allergies: clean(allergies),
      chronicConditions: clean(chronicConditions),
    },
  });

  res.json({ patient });
}