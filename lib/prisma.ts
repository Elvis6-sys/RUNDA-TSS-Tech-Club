import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const dbUrl = process.env.DATABASE_URL;
console.log(`📊 [PRISMA] Initializing with database: ${dbUrl}`);

// Always use the global singleton to prevent multiple PrismaClient instances.
// Multiple instances pointing at the same SQLite file cause SQLITE_BUSY errors
// under concurrent writes (e.g. quiz submission + integrity report at the same time).
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Keep the singleton alive across hot-reloads in dev AND across module
// re-evaluations in the Next.js standalone production server.
global.prisma = prisma;

// Disconnect cleanly when the process exits (dev and prod).
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
