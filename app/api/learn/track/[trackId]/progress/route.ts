/**
 * POST /api/learn/track/[trackId]/progress
 *
 * Saves reading progress for a specific SkillNode within a track.
 * Called by StudentModuleViewer when a student views content.
 *
 * Body: { nodeId: string; readPct: number; status?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { nodeId: string; readPct?: number; status?: string };
    if (!body.nodeId) return NextResponse.json({ error: "nodeId required" }, { status: 400 });

    const readPct = typeof body.readPct === "number"
      ? Math.min(100, Math.max(0, Math.round(body.readPct)))
      : 0;

    // Determine status from readPct if not explicitly passed
    let status = body.status;
    if (!status) {
      status = readPct >= 100 ? "done" : readPct > 0 ? "studying" : "not_started";
    }

    // Upsert progress — never decrease readPct (progress only moves forward)
    const existing = await prisma.skillProgress.findUnique({
      where: { userId_nodeId: { userId: user.id, nodeId: body.nodeId } },
      select: { readPct: true, status: true },
    });

    const finalReadPct = existing ? Math.max(existing.readPct, readPct) : readPct;

    // Don't downgrade status (not_started < studying < done < verified)
    const STATUS_RANK: Record<string, number> = {
      not_started: 0, studying: 1, done: 2, verified: 3,
    };
    const existingRank = STATUS_RANK[existing?.status ?? "not_started"] ?? 0;
    const newRank = STATUS_RANK[status] ?? 0;
    const finalStatus = newRank >= existingRank ? status : (existing?.status ?? status);

    await prisma.skillProgress.upsert({
      where: { userId_nodeId: { userId: user.id, nodeId: body.nodeId } },
      create: {
        userId: user.id,
        nodeId: body.nodeId,
        readPct: finalReadPct,
        status: finalStatus,
      },
      update: {
        readPct: finalReadPct,
        status: finalStatus,
      },
    });

    return NextResponse.json({ ok: true, readPct: finalReadPct, status: finalStatus });
  } catch (error) {
    console.error("[track-progress] Error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
