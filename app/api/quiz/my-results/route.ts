/**
 * GET /api/quiz/my-results
 *
 * Returns only submissions where marksReleased = true.
 * Students cannot see their scores until the teacher explicitly releases them.
 */
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    console.log("[my-results] 📥 Student requesting their results");

    // Local auth
    const user = await getCurrentUser();
    if (!user) {
      console.log("[my-results] ❌ No user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[my-results] 👤 User ID:", user.id);

    // Only return submissions that are fully graded AND marks have been released by teacher
    const submissions = await prisma.quizBlockSubmission.findMany({
      where: {
        userId: user.id,
        status: "graded",
        avgScore: { not: null },
        marksReleased: true,       // ← key gate: teacher must release before student sees
      },
      include: {
        node: { select: { id: true, title: true, trackId: true } },
        track: { select: { id: true, name: true, tier: true, icon: true } },
      },
      orderBy: { marksReleasedAt: "desc" },
    });

    console.log("[my-results] 📊 Found", submissions.length, "released submissions");
    submissions.forEach(s => {
      console.log(`[my-results]   - ${s.id}: ${s.node.title}, avgScore=${s.avgScore}%, released=${s.marksReleased}, releasedAt=${s.marksReleasedAt}`);
    });

    const submissionsWithResponses = await Promise.all(
      submissions.map(async (sub) => {
        const responses = await prisma.quizResponse.findMany({
          where: { userId: user.id, nodeId: sub.nodeId, blockId: sub.blockId },
          orderBy: { questionIdx: "asc" },
          select: {
            id: true,
            questionIdx: true,
            questionType: true,
            answerText: true,
            answerChoice: true,
            gradeScore: true,
            gradeNotes: true,
            gradedAt: true,
            autoGraded: true,
          },
        });
        return {
          ...sub,
          responses,
          marksReleasedAt: sub.marksReleasedAt?.toISOString() ?? null,
        };
      })
    );

    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });

    // Also count pending (graded but not yet released) so the student knows to wait
    const pendingRelease = await prisma.quizBlockSubmission.count({
      where: {
        userId: user.id,
        status: "graded",
        avgScore: { not: null },
        marksReleased: false,
      },
    });

    console.log("[my-results] ⏳ Pending release:", pendingRelease);
    console.log("[my-results] ✅ Returning", submissionsWithResponses.length, "submissions to student");

    return NextResponse.json({
      student: profile,
      submissions: submissionsWithResponses,
      pendingRelease,   // student UI can show "X results pending release"
    });
  } catch (e) {
    console.error("[my-results]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
