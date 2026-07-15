import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth";

function issueToken(res: Response, payload: object) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("❌ Configuration Error: JWT_SECRET environment variable is missing!");
    const err = new Error("JWT_SECRET environment variable is not configured on the server.");
    // Mark the error so callers can return a friendly, user-facing message
    (err as any).code = "MISSING_JWT_SECRET";
    throw err;
  }
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
  try {
    const { clinicName, clinicEmail, clinicPhone, clinicAddress,
            adminName, adminEmail, adminPassword } = req.body;

    if (!clinicName || !adminEmail || !adminPassword || !adminName) {
      res.status(400).json({ error: "Missing required fields (clinicName, adminName, adminEmail, adminPassword)" });
      return;
    }

    if (typeof clinicName !== "string" || typeof adminName !== "string" ||
        typeof adminEmail !== "string" || typeof adminPassword !== "string") {
      res.status(400).json({ error: "Required fields must be strings" });
      return;
    }

    const emailNormalized = adminEmail.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
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
          name: clinicName.trim(),
          email: clinicEmail ? String(clinicEmail).trim().toLowerCase() : emailNormalized,
          phone: clinicPhone ? String(clinicPhone).trim() : "",
          address: clinicAddress ? String(clinicAddress).trim() : "",
        },
      });

      const admin = await tx.user.create({
        data: {
          clinicId: clinic.id,
          name: adminName.trim(),
          email: emailNormalized,
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
  } catch (error: any) {
    console.error("❌ Registration Error:", error);
    if (error.code === "MISSING_JWT_SECRET") {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Authentication service temporarily unavailable. Please try again later or contact support.",
      });
      return;
    }

    if (error.code === "P2022") {
      console.error("❌ Database schema mismatch:", error.meta);
      res.status(503).json({
        error: "Service Unavailable",
        message: "The database schema is out of sync with the application. Please run the database migrations or contact the administrator.",
      });
      return;
    }

    if (error.name === "PrismaClientInitializationError" || error.code === "P1001") {
      res.status(503).json({
        error: "Database Connection Error",
        message: "Unable to connect to the database. Please verify database availability.",
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred during registration.",
    });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    // Log the incoming request body for debugging
    console.log('🔍 Login request body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Email and password must be valid strings" });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      include: { clinic: true },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Debug: log user retrieval
    console.log('🔎 User fetched:', {
      id: user?.id,
      clinicId: user?.clinicId,
      hasClinic: !!user?.clinic,
    });

    // Debug: password verification result (after checking user)
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔑 Password valid:', valid);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (user.status === "SUSPENDED") {
      res.status(403).json({ error: "Account suspended. Contact your clinic admin." });
      return;
    }

    // Ensure associated clinic exists
    if (!user.clinic) {
      console.error('❌ Login Error: User has no associated clinic');
      res.status(400).json({ error: "Bad Request", message: "User is not linked to any clinic. Please ensure the user has a clinic association." });
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
  } catch (error: any) {
    console.error("❌ Login Error:", error);
    if (error.code === "MISSING_JWT_SECRET") {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Authentication service temporarily unavailable. Please try again later or contact support.",
      });
      return;
    }

    if (error.name === "PrismaClientInitializationError" || error.code === "P1001") {
      res.status(503).json({
        error: "Database Connection Error",
        message: "Unable to connect to the database. Please verify database availability.",
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred during login.",
    });
  }
}

// GET /api/auth/me
export async function me(req: AuthRequest, res: Response) {
  try {
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
  } catch (error: any) {
    console.error("❌ Auth Me Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred while fetching user status.",
    });
  }
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });
    res.json({ message: "Logged out" });
  } catch (error: any) {
    console.error("❌ Logout Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred during logout.",
    });
  }
}
