import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances during hot reload in development.
// In production there is only one instance anyway.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
