import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

// Helper — signs a JWT and sets it as an httpOnly cookie
function issueToken(res: Response, payload: object) {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];

  const token = jwt.sign(payload, secret, { expiresIn });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/register
// Creates a new Clinic + Admin user atomically.
// If either fails, both are rolled back.
export async function register(req: Request, res: Response) {
  const { clinicName, clinicEmail, clinicPhone, clinicAddress,
          adminName, adminEmail, adminPassword } = req.body;

  // Basic presence check
  if (!clinicName || !adminEmail || !adminPassword || !adminName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Check if admin email already exists
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Atomic transaction — clinic + admin created together or not at all
  const { clinic, admin } = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        name: clinicName,
        email: clinicEmail ?? adminEmail,
        phone: clinicPhone ?? "",
        address: clinicAddress ?? "",
      },
    });

    const admin = await tx.user.create({
      data: {
        clinicId: clinic.id,
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });

    return { clinic, admin };
  });

  issueToken(res, {
    userId: admin.id,
    clinicId: clinic.id,
    role: admin.role,
  });

  res.status(201).json({
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      clinicId: clinic.id,
    },
    clinic: {
      id: clinic.id,
      name: clinic.name,
    },
  });
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { clinic: true },
  });

  if (!user) {
    // Same message for wrong email or wrong password — don't leak which one
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.status === "SUSPENDED") {
    res.status(403).json({ error: "Account suspended. Contact your clinic admin." });
    return;
  }

  issueToken(res, {
    userId: user.id,
    clinicId: user.clinicId,
    role: user.role,
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    },
    clinic: {
      id: user.clinic.id,
      name: user.clinic.name,
    },
  });
}

// GET /api/auth/me
export async function me(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: { clinic: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    },
    clinic: {
      id: user.clinic.id,
      name: user.clinic.name,
    },
  });
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ message: "Logged out" });
}
