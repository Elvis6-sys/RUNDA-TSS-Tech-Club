/**
 * RUNDA Local Node — Sync Script
 * --------------------------------
 * Run this whenever internet is available (even briefly).
 * It will:
 *   1. Pull all lessons from central Supabase → local SQLite
 *   2. Push unsynced student progress from local SQLite → central Postgres
 *
 * Usage:
 *   npm run sync
 */

import { PrismaClient as CentralClient } from "@prisma/client";
import { PrismaClient as LocalClient } from "../node_modules/.prisma/local-client";
import * as path from "path";

const central = new CentralClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const local = new LocalClient({
  datasources: {
    db: { url: `file:${path.resolve(__dirname, "../prisma-local/local.db")}` },
  },
});

async function syncDown(): Promise<number> {
  console.log("\n📥  Pulling lessons from central server...");
  const lessons = await central.lesson.findMany({
    orderBy: [{ subject: "asc" }, { order: "asc" }],
  });

  for (const lesson of lessons) {
    await local.lesson.upsert({
      where: { id: lesson.id },
      update: {
        title: lesson.title,
        subject: lesson.subject,
        tierVisibility: lesson.tierVisibility,
        content: lesson.content,
        order: lesson.order,
        syncedAt: new Date(),
      },
      create: {
        id: lesson.id,
        title: lesson.title,
        subject: lesson.subject,
        tierVisibility: lesson.tierVisibility,
        content: lesson.content,
        order: lesson.order,
        syncedAt: new Date(),
      },
    });
    console.log(`  ✓ ${lesson.subject} — ${lesson.title}`);
  }

  console.log(`\n  ${lessons.length} lessons synced to local database.`);
  return lessons.length;
}

async function syncUp(): Promise<number> {
  console.log("\n📤  Pushing student progress to central server...");
  const unsynced = await local.localProgress.findMany({
    where: { synced: false },
    include: { student: true, lesson: true },
  });

  if (!unsynced.length) {
    console.log("  Nothing to push.");
    return 0;
  }

  let count = 0;
  for (const p of unsynced) {
    try {
      if (p.student.phone) {
        const centralUser = await central.userProfile.findUnique({
          where: { phone: p.student.phone },
        });
        if (centralUser) {
          await local.localProgress.update({
            where: { id: p.id },
            data: { synced: true },
          });
          count++;
          console.log(`  ✓ ${p.student.name} — ${p.lesson.title}`);
        }
      }
    } catch {
      console.log(`  ⚠ Could not sync: ${p.student.name}`);
    }
  }

  console.log(`\n  ${count} progress records pushed.`);
  return count;
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  RUNDA Local Node — Sync");
  console.log(`  ${new Date().toLocaleString()}`);
  console.log("═══════════════════════════════════════");

  let lessonsDown = 0;
  let progressUp = 0;
  let status = "ok";
  let error: string | undefined;

  try {
    lessonsDown = await syncDown();
    progressUp = await syncUp();
  } catch (e: unknown) {
    status = "error";
    error = e instanceof Error ? e.message : String(e);
    console.error("\n❌  Sync failed:", error);
  }

  await local.syncLog.create({
    data: { lessonsDown, progressUp, status, error },
  });

  console.log("\n═══════════════════════════════════════");
  console.log(`  Done — ${lessonsDown} lessons ↓  ${progressUp} progress ↑`);
  console.log("═══════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await central.$disconnect();
    await local.$disconnect();
  });
