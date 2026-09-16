import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";

// POST — Grade multiple responses at once (bulk manual grading)
// Fixed: Now uses ||| separator to properly handle IDs with hyphens
export async function POST(req: NextRequest) {
  try {
    console.log("[bulk-grade] 📥 Received bulk grading request");

    // Local auth
    const user = await getCurrentUser();
    if (!user) {
      console.log("[bulk-grade] ❌ No user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await getCallerProfile(user.id);
    if (!caller) {
      console.log("[bulk-grade] ❌ No caller profile");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { grades, trackId } = await req.json() as {
      grades: Array<{ responseId: string; gradeScore: number; gradeNotes?: string }>;
      trackId: string;
    };

    console.log("[bulk-grade] 📝 Grading", grades.length, "responses for track:", trackId);

    if (!(await canManageTrack(caller, trackId))) {
      console.log("[bulk-grade] ❌ Cannot manage track");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Grade all responses in a transaction
    const updatedResponses = await prisma.$transaction(
      grades.map(g =>
        prisma.quizResponse.update({
          where: { id: g.responseId },
          data: {
            gradeScore: g.gradeScore,
            gradeNotes: g.gradeNotes || "",
            gradedBy: user.id,
            gradedAt: new Date(),
          },
        })
      )
    );

    // Group by submission and update each
    const submissionGroups = new Map<string, { userId: string; nodeId: string; blockId: string }>();

    for (const r of updatedResponses) {
      const key = `${r.userId}|||${r.nodeId}|||${r.blockId}`;  // Use ||| as separator (can't appear in IDs)
      submissionGroups.set(key, { userId: r.userId, nodeId: r.nodeId, blockId: r.blockId });
    }

    console.log("[bulk-grade] 📦 Updating", submissionGroups.size, "submissions");

    for (const [key, { userId, nodeId, blockId }] of submissionGroups) {
      console.log("[bulk-grade] 🔍 Looking for submission:", { userId, nodeId, blockId });

      const submission = await prisma.quizBlockSubmission.findUnique({
        where: { userId_nodeId_blockId: { userId, nodeId, blockId } },
      });

      if (!submission) {
        console.log("[bulk-grade] ⚠️  Submission not found for:", { userId, nodeId, blockId });
        continue;
      }

      const allResponses = await prisma.quizResponse.findMany({
        where: { userId, nodeId, blockId },
      });

      const gradedResponses = allResponses.filter(r => r.gradeScore !== null);
      const gradedCount = gradedResponses.length;
      const avgScore = gradedCount > 0
        ? Math.round(gradedResponses.reduce((sum, r) => sum + (r.gradeScore ?? 0), 0) / gradedCount)
        : null;

      const allGraded = gradedCount === allResponses.length;

      console.log("[bulk-grade] 📊 Submission", submission.id, ":", {
        gradedCount,
        totalQuestions: allResponses.length,
        avgScore,
        allGraded,
        newStatus: allGraded ? "graded" : "grading"
      });

      const updated = await prisma.quizBlockSubmission.update({
        where: { id: submission.id },
        data: { gradedCount, avgScore, status: allGraded ? "graded" : "grading" },
      });

      console.log("[bulk-grade] ✅ Submission updated:", {
        id: updated.id,
        status: updated.status,
        avgScore: updated.avgScore,
        gradedCount: updated.gradedCount,
        marksReleased: updated.marksReleased
      });

      // Notify student if all graded
      if (allGraded && avgScore !== null) {
        console.log("[bulk-grade] 🔔 Creating notification for user:", userId);
        await prisma.quizGradeNotification.create({
          data: {
            userId,
            blockSubmissionId: submission.id,
            title: "Quiz fully graded!",
            message: `All your quiz responses have been graded. Average score: ${avgScore}%`,
          },
        });
      }
    }

    console.log("[bulk-grade] ✅ Success! Graded", grades.length, "responses");
    return NextResponse.json({ ok: true, gradedCount: grades.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
