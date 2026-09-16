/**
 * GET /api/passport/progress/bulk?ids=slug1,slug2,...
 *
 * Returns per-module progress for the current user given a list of
 * learn-module slugs (e.g. "l3-js", "l4-db").
 *
 * Response: Record<slug, { readPct: number; status: string; nodeId: string | null }>
 *
 * Used by PassportClient to show ProgressRings on every module card.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = req.nextUrl.searchParams.get("ids") ?? "";
  const slugs = raw.split(",").map(s => s.trim()).filter(Boolean).slice(0, 100);

  if (slugs.length === 0) return NextResponse.json({});

  // SkillNodes linked to these slugs are seeded with IDs like "seed-node-<trackId>-<order>"
  // We look them up by matching the slug pattern in the node ID
  const nodeRows = await prisma.skillNode.findMany({
    where: {
      id: { in: slugs.map(s => `seed-node-seed-track-${s}-0`).concat(
        // also try exact slug as node id (for learn-content seeded nodes)
        slugs
      ) },
    },
    select: { id: true },
  });

  // Also try matching via the learn-module slug → track name approach
  // by looking for SkillProgress records where nodeId starts with seed-node-*
  const allProgress = await prisma.skillProgress.findMany({
    where: { userId: user.id },
    select: { nodeId: true, readPct: true, status: true },
  });

  // Build a map nodeId → progress
  const progMap = new Map(allProgress.map(p => [p.nodeId, p]));

  // For each slug, figure out the best matching nodeId
  const result: Record<string, { readPct: number; status: string; nodeId: string | null }> = {};

  for (const slug of slugs) {
    // Pattern: seed-node-seed-track-<slug>-<order>
    const candidateIds = allProgress
      .map(p => p.nodeId)
      .filter(id => id.includes(slug.replace(/-/g, "-")));

    // Pick the node with highest readPct among candidates
    let best: { readPct: number; status: string; nodeId: string | null } = {
      readPct: 0,
      status: "not_started",
      nodeId: null,
    };

    for (const nid of candidateIds) {
      const p = progMap.get(nid);
      if (p && p.readPct > best.readPct) {
        best = { readPct: p.readPct, status: p.status, nodeId: nid };
      }
    }

    result[slug] = best;
  }

  return NextResponse.json(result);
}

/**
 * POST /api/passport/progress/bulk
 *
 * Records that a student opened / viewed a module.
 * Body: { moduleId: string; action: "open" | "scroll" | "complete" }
 *
 * This bumps the SkillProgress readPct by a fixed amount per action
 * so that mere engagement (opening a PDF, scrolling) registers progress.
 */
export async function POST(req: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nodeId, action } = await req.json() as {
    nodeId: string;
    action: "open" | "scroll" | "complete";
  };

  if (!nodeId) return NextResponse.json({ error: "nodeId required" }, { status: 400 });

  // Verify node exists
  const node = await prisma.skillNode.findUnique({ where: { id: nodeId }, select: { id: true } });
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  // Action → readPct increment map
  const PCT_MAP: Record<string, number> = { open: 15, scroll: 30, complete: 100 };
  const newPct = PCT_MAP[action] ?? 15;

  const existing = await prisma.skillProgress.findUnique({
    where: { userId_nodeId: { userId: user.id, nodeId } },
    select: { readPct: true, status: true },
  });

  const finalPct = Math.max(existing?.readPct ?? 0, newPct);
  const finalStatus =
    finalPct >= 100 ? "done" :
    finalPct >= 15  ? "studying" :
    (existing?.status ?? "studying");

  const updated = await prisma.skillProgress.upsert({
    where: { userId_nodeId: { userId: user.id, nodeId } },
    create: { userId: user.id, nodeId, readPct: finalPct, status: finalStatus },
    update: { readPct: finalPct, status: finalStatus },
    select: { readPct: true, status: true, nodeId: true },
  });

  return NextResponse.json(updated);
}
