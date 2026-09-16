import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

// POST — saves scroll-based reading progress for lesson-backed modules
export async function POST(req: NextRequest, { params }: { params: { nodeId: string } }) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { readPct, status } = await req.json() as { readPct: number; status: string };

  const validStatus = ["studying", "done"].includes(status) ? status : "studying";
  const clampedPct = Math.min(100, Math.max(0, Math.round(readPct)));

  // Never downgrade: if already done/verified keep it
  const existing = await prisma.skillProgress.findUnique({
    where: { userId_nodeId: { userId: user.id, nodeId: params.nodeId } },
    select: { status: true },
  });
  const keepStatus = existing?.status === "done" || existing?.status === "verified";

  const progress = await prisma.skillProgress.upsert({
    where: { userId_nodeId: { userId: user.id, nodeId: params.nodeId } },
    update: {
      readPct: clampedPct,
      ...(keepStatus ? {} : { status: validStatus }),
    },
    create: {
      userId: user.id,
      nodeId: params.nodeId,
      readPct: clampedPct,
      status: validStatus,
    },
  });

  return NextResponse.json({ readPct: progress.readPct, status: progress.status });
}
