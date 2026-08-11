import type { Response } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

// PATCH /api/clinic
// Updates the logged-in user's own clinic. The clinic is derived from the
// token (req.user.clinicId) — never from the client — so a user can only ever
// edit their own clinic. Admin-only.
export async function updateClinic(req: AuthRequest, res: Response) {
  const clinicId = req.user!.clinicId;

  // Only ADMIN can edit the clinic profile
  if (req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admins can edit the clinic profile" });
    return;
  }

  // Whitelist editable fields only. We deliberately do NOT spread req.body —
  // that would let a client sneak in plan/subscriptionStatus and upgrade
  // themselves. Pull exactly the four profile fields and ignore the rest.
  const { name, address, phone, email } = req.body;

  // At least one field must be present
  if (
    name === undefined &&
    address === undefined &&
    phone === undefined &&
    email === undefined
  ) {
    res.status(400).json({ error: "No editable fields provided" });
    return;
  }

  // Name, if provided, cannot be blank
  if (name !== undefined && !String(name).trim()) {
    res.status(400).json({ error: "Clinic name cannot be empty" });
    return;
  }

  // Build the update object from only the fields actually sent
  const data: { name?: string; address?: string; phone?: string; email?: string } = {};
  if (name !== undefined) data.name = String(name).trim();
  if (address !== undefined) data.address = String(address).trim();
  if (phone !== undefined) data.phone = String(phone).trim();
  if (email !== undefined) data.email = String(email).trim();

  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data,
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      email: true,
    },
  });

  res.json({ clinic });
}
