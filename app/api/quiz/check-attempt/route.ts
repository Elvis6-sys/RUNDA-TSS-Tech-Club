/**
 * GET /api/quiz/check-attempt?nodeId=...&blockId=...
 *
 * Returns whether the authenticated student has already submitted this quiz block.
 * Used by SecureQuizLauncher to enforce the one-attempt rule before even showing
 * the "Start Quiz" button.
 */
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const nodeId  = req.nextUrl.searchParams.get("nodeId");
    const blockId = req.nextUrl.searchParams.get("blockId");

    if (!nodeId || !blockId) {
      return NextResponse.json({ error: "nodeId and blockId are required" }, { status: 400 });
    }

    const submission = await prisma.quizBlockSubmission.findUnique({
      where: { userId_nodeId_blockId: { userId: user.id, nodeId, blockId } },
      select: {
        id: true,
        status: true,
        totalQuestions: true,
        gradedCount: true,
        avgScore: true,
        autoSubmitted: true,
        marksReleased: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      attempted: !!submission,
      submission: submission ?? null,
    });
  } catch (e) {
    console.error("[check-attempt]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
