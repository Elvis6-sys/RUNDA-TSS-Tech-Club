import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";

// POST — grade a single quiz response and notify student
export async function POST(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await getCallerProfile(user.id);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { responseId, gradeScore, gradeNotes, trackId } = await req.json() as {
      responseId: string;
      gradeScore: number;
      gradeNotes?: string;
      trackId: string;
    };

    if (!(await canManageTrack(caller, trackId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Grade the individual response
    const response = await prisma.quizResponse.update({
      where: { id: responseId },
      data: {
        gradeScore,
        gradeNotes,
        gradedBy: user.id,
        gradedAt: new Date(),
      },
    });

    // Find the parent submission
    const submission = await prisma.quizBlockSubmission.findUnique({
      where: {
        userId_nodeId_blockId: {
          userId: response.userId,
          nodeId: response.nodeId,
          blockId: response.blockId,
        },
      },
    });

    if (submission) {
      const allResponses = await prisma.quizResponse.findMany({
        where: {
          userId: response.userId,
          nodeId: response.nodeId,
          blockId: response.blockId,
        },
      });

      const gradedResponses = allResponses.filter((r) => r.gradeScore !== null);
      const gradedCount = gradedResponses.length;
      const avgScore =
        gradedCount > 0
          ? Math.round(
            gradedResponses.reduce((sum, r) => sum + (r.gradeScore ?? 0), 0) /
            gradedCount
          )
          : null;

      const allGraded = gradedCount === allResponses.length;

      await prisma.quizBlockSubmission.update({
        where: { id: submission.id },
        data: { gradedCount, avgScore, status: allGraded ? "graded" : "grading" },
      });

      // Notify student once all questions are graded
      if (allGraded) {
        await prisma.quizGradeNotification.create({
          data: {
            userId: response.userId,
            blockSubmissionId: submission.id,
            title: "Your quiz has been graded!",
            message: `Average score: ${avgScore}%`,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET — list all submissions for a track (teacher grading dashboard)
export async function GET(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) {
      console.log("[quiz/grade GET] No user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await getCallerProfile(user.id);
    if (!caller) {
      console.log("[quiz/grade GET] No caller profile for", user.id);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trackId = req.nextUrl.searchParams.get("trackId");
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });

    const allowed = await canManageTrack(caller, trackId);
    console.log("[quiz/grade GET] caller:", caller.id, "role:", caller.role, "trackId:", trackId, "allowed:", allowed);

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submissions = await prisma.quizBlockSubmission.findMany({
      where: { trackId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        node: { select: { id: true, title: true, blocks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    console.log("[quiz/grade GET] Found", submissions.length, "submissions for track", trackId);
    return NextResponse.json({ submissions });
  } catch (e) {
    console.error("[quiz/grade GET] Error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
