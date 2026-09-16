import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { nodeId: string } }) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blockId, state, payload } = await req.json();
  if (!blockId || !state) return NextResponse.json({ error: "blockId and state required" }, { status: 400 });

  await prisma.blockProgress.upsert({
    where: { userId_nodeId_blockId: { userId: user!.id, nodeId: params.nodeId, blockId } },
    update: { state, payload: payload ?? {} },
    create: { userId: user!.id, nodeId: params.nodeId, blockId, state, payload: payload ?? {} },
  });

  const node = await prisma.skillNode.findUnique({
    where: { id: params.nodeId },
    select: { blocks: true },
  });

  const blocks = (node?.blocks ?? []) as { id: string }[];
  const totalBlocks = blocks.length;

  if (totalBlocks > 0) {
    const completedCount = await prisma.blockProgress.count({
      where: {
        userId: user!.id,
        nodeId: params.nodeId,
        state: { in: ["read", "correct", "checked", "ran"] },
      },
    });

    const readPct = Math.round((completedCount / totalBlocks) * 100);
    const newStatus = readPct >= 100 ? "done" : "studying";

    await prisma.skillProgress.upsert({
      where: { userId_nodeId: { userId: user!.id, nodeId: params.nodeId } },
      update: { readPct, status: newStatus },
      create: { userId: user!.id, nodeId: params.nodeId, status: newStatus, readPct },
    });

    return NextResponse.json({ readPct, status: newStatus });
  }

  return NextResponse.json({ readPct: 0, status: "studying" });
}
