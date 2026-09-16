import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { getLearnModule } from "@/lib/learnContent";

// POST /api/learn/[moduleSlug]/progress
// Auto-provisions SkillTrack + SkillNode if they don't exist yet,
// then upserts SkillProgress for the current user.
export async function POST(
  request: NextRequest,
  { params }: { params: { moduleSlug: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleSlug } = params;
  const module = getLearnModule(moduleSlug);
  if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  let body: { readPct?: number; status?: string; outcomeNumber?: number } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  const readPct = typeof body.readPct === "number" ? Math.min(100, Math.max(0, body.readPct)) : 0;
  const status = body.status ?? "studying";

  // ── 1. Find or create SkillTrack ─────────────────────────────────────────
  let track = await prisma.skillTrack.findFirst({
    where: { name: module.trackName, tier: module.tier },
  });

  if (!track) {
    track = await prisma.skillTrack.create({
      data: {
        name: module.trackName,
        tier: module.tier,
        description: `L4 Software Development — Specific Modules`,
        icon: "💻",
        order: 10,
      },
    });
  }

  // ── 2. Find or create SkillNode ───────────────────────────────────────────
  // We use the moduleSlug as a unique lookup key via the description field
  // (or we can look up by title + trackId which is more reliable)
  let node = await prisma.skillNode.findFirst({
    where: {
      trackId: track.id,
      title: { contains: module.moduleCode },
    },
  });

  if (!node) {
    node = await prisma.skillNode.create({
      data: {
        trackId: track.id,
        title: `${module.moduleCode} — ${module.title}`,
        description: module.description,
        xpReward: module.xpReward,
        estimatedMinutes: module.estimatedMinutes,
        order: 0,
        blocks: JSON.stringify([]),
      },
    });
  }

  // ── 3. Upsert SkillProgress ───────────────────────────────────────────────
  // Never decrease readPct (progress only moves forward)
  const existing = await prisma.skillProgress.findUnique({
    where: { userId_nodeId: { userId: user.id, nodeId: node.id } },
  });

  const finalReadPct = existing
    ? Math.max(existing.readPct, readPct)
    : readPct;

  // Only upgrade status, never downgrade
  const statusRank: Record<string, number> = {
    not_started: 0,
    studying: 1,
    done: 2,
    verified: 3,
  };
  const finalStatus =
    (statusRank[status] ?? 1) > (statusRank[existing?.status ?? "not_started"] ?? 0)
      ? status
      : (existing?.status ?? "studying");

  const progress = await prisma.skillProgress.upsert({
    where: { userId_nodeId: { userId: user.id, nodeId: node.id } },
    create: {
      userId: user.id,
      nodeId: node.id,
      readPct: finalReadPct,
      status: finalStatus,
    },
    update: {
      readPct: finalReadPct,
      status: finalStatus,
    },
  });

  return NextResponse.json({
    nodeId: node.id,
    readPct: progress.readPct,
    status: progress.status,
  });
}

// GET /api/learn/[moduleSlug]/progress
// Returns the current user's progress for this module (if any).
export async function GET(
  _request: NextRequest,
  { params }: { params: { moduleSlug: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleSlug } = params;
  const module = getLearnModule(moduleSlug);
  if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  const node = await prisma.skillNode.findFirst({
    where: {
      track: { name: module.trackName, tier: module.tier },
      title: { contains: module.moduleCode },
    },
  });

  if (!node) {
    return NextResponse.json({ readPct: 0, status: "not_started", nodeId: null });
  }

  const progress = await prisma.skillProgress.findUnique({
    where: { userId_nodeId: { userId: user.id, nodeId: node.id } },
  });

  return NextResponse.json({
    nodeId: node.id,
    readPct: progress?.readPct ?? 0,
    status: progress?.status ?? "not_started",
  });
}
