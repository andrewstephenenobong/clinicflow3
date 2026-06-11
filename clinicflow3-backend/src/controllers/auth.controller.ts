import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

function issueToken(res: Response, payload: object) {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];
  const token = jwt.sign(payload, secret, { expiresIn });

  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,                          // HTTPS-only in production
    sameSite: isProd ? "none" : "lax",       // cross-site cookie needs None in prod
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  const { clinicName, clinicEmail, clinicPhone, clinicAddress,
          adminName, adminEmail, adminPassword } = req.body;

  if (!clinicName || !adminEmail || !adminPassword || !adminName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  // Hash BEFORE the transaction — bcrypt is slow and times out inside Prisma tx
  const passwordHash = await bcrypt.hash(adminPassword, 12);

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
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
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
      address: user.clinic.address,
      phone: user.clinic.phone,
      email: user.clinic.email,
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
      address: user.clinic.address,
      phone: user.clinic.phone,
      email: user.clinic.email,
    },
  });
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.json({ message: "Logged out" });
}
