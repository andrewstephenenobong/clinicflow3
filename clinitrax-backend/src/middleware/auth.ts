import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

// Extend Express Request to carry the decoded user payload
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    clinicId: string;
    role: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Read token from httpOnly cookie (D5)
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      clinicId: string;
      role: string;
    };

    // Check user status in the database to prevent suspended users from making requests
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { status: true, deletedAt: true },
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      res.status(401).json({ error: "Account suspended or deactivated. Contact your clinic admin." });
      return;
    }

    // Attach to request — controllers read from req.user
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
