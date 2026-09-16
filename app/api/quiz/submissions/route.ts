import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const nodeId = req.nextUrl.searchParams.get("nodeId");
    const blockId = req.nextUrl.searchParams.get("blockId");
    if (!nodeId || !blockId) {
      return NextResponse.json({ error: "nodeId and blockId required" }, { status: 400 });
    }

    const submissions = await prisma.quizBlockSubmission.findMany({
      where: { userId: user.id, nodeId, blockId },
      select: {
        id: true, status: true, totalQuestions: true,
        gradedCount: true, avgScore: true,
        marksReleased: true, marksReleasedAt: true,
        autoSubmitted: true, createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({ submissions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
