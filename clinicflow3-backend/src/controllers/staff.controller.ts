import type { Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth";

// GET /api/staff
export async function getStaff(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  const staff = await prisma.user.findMany({
    where: { clinicId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  res.json({ staff });
}

// POST /api/staff
export async function createStaff(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "name, email, password and role are required" });
    return;
  }

  // Only ADMIN can create staff
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admins can add staff" });
    return;
  }

  // Validate role
  const validRoles: Role[] = [Role.DOCTOR, Role.RECEPTIONIST, Role.SECURITY_OFFICER];
    if (!validRoles.includes(role as Role)) {
    res.status(400).json({ error: "Invalid role. Must be DOCTOR, RECEPTIONIST, or SECURITY_OFFICER" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      clinicId,
      name,
      email,
      passwordHash,
      role: role as Role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  res.status(201).json({ user });
}

// DELETE /api/staff/:id
export async function removeStaff(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;
  const staffId = req.params.id as string;

  // Only ADMIN can remove staff
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admins can remove staff" });
    return;
  }

  // Cannot remove yourself
  if (staffId === req.user!.userId) {
    res.status(400).json({ error: "You cannot remove your own account" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: staffId } });

  if (!user || user.clinicId !== clinicId) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  await prisma.user.delete({ where: { id: staffId } });

  res.json({ message: "Staff member removed" });
}
