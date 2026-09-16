import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

// GET — admin sees every student's progress per node
export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await prisma.userProfile.findUnique({
    where: { id: user!.id },
    select: { role: true },
  });
  if (!caller || !["admin", "alumni", "l5"].includes(caller.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [tracks, allProgress] = await Promise.all([
    prisma.skillTrack.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        tier: true,
        icon: true,
        order: true,
        nodes: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            xpReward: true,
          }
        },
      },
    }),
    prisma.skillProgress.findMany({
      select: {
        id: true,
        userId: true,
        nodeId: true,
        status: true,
        readPct: true,
        verifiedBy: true,
        evidenceUrl: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            level: true,
          }
        },
        node: {
          select: {
            id: true,
            title: true,
            trackId: true,
          }
        },
      },
    }),
  ]);

  return NextResponse.json({ tracks, progress: allProgress });
}
