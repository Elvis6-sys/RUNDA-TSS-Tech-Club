import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

// POST — student marks a node as "studying" or "done" with optional evidence
export async function POST(req: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nodeId, status, evidenceUrl } = await req.json();
  if (!nodeId || !["studying", "done"].includes(status))
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const progress = await prisma.skillProgress.upsert({
    where: { userId_nodeId: { userId: user!.id, nodeId } },
    update: { status, evidenceUrl: evidenceUrl ?? undefined },
    create: { userId: user!.id, nodeId, status, evidenceUrl: evidenceUrl ?? undefined },
  });

  return NextResponse.json(progress);
}

// PATCH — teacher / l5 / alumni verifies a node → awards XP
export async function PATCH(req: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const verifier = await prisma.userProfile.findUnique({
    where: { id: user!.id },
    select: { role: true },
  });
  if (!verifier || !["admin", "alumni", "l5"].includes(verifier.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { progressId } = await req.json();
  if (!progressId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.skillProgress.findUnique({
    where: { id: progressId },
    include: { node: { select: { xpReward: true, title: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status === "verified")
    return NextResponse.json({ error: "Already verified" }, { status: 409 });

  // Verify + award XP in a transaction
  const [updated] = await prisma.$transaction([
    prisma.skillProgress.update({
      where: { id: progressId },
      data: { status: "verified", verifiedBy: user!.id, verifiedAt: new Date() },
    }),
    prisma.userProfile.update({
      where: { id: existing.userId },
      data: { xp: { increment: existing.node.xpReward } },
    }),
    prisma.xpEvent.create({
      data: {
        userId: existing.userId,
        amount: existing.node.xpReward,
        reason: "skill_verified",
        refId: existing.nodeId,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
