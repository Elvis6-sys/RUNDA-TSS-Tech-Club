/**
 * POST /api/quiz/release-marks
 *
 * Teacher releases marks for one or more submissions.
 * Once released, students can see their scores in My Results.
 * Supports both single and bulk release.
 *
 * Body: { submissionIds: string[], trackId: string, unreleased?: boolean }
 * unreleased = true → un-release (hide marks again)
 */
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";

export async function POST(req: NextRequest) {
  try {
    console.log("[release-marks] 📥 Received release request");

    // Local auth
    const user = await getCurrentUser();
    if (!user) {
      console.log("[release-marks] ❌ No user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caller = await getCallerProfile(user.id);
    if (!caller) {
      console.log("[release-marks] ❌ No caller profile");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionIds, trackId, unreleased = false } = await req.json() as {
      submissionIds: string[];
      trackId: string;
      unreleased?: boolean;
    };

    console.log("[release-marks] 📋", unreleased ? "UN-releasing" : "RELEASING", submissionIds.length, "submissions");
    console.log("[release-marks] Submission IDs:", submissionIds);

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      console.log("[release-marks] ❌ No submissionIds");
      return NextResponse.json({ error: "submissionIds required" }, { status: 400 });
    }
    if (!trackId) {
      console.log("[release-marks] ❌ No trackId");
      return NextResponse.json({ error: "trackId required" }, { status: 400 });
    }

    if (!(await canManageTrack(caller, trackId))) {
      console.log("[release-marks] ❌ Cannot manage track");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify all submissions belong to this track (security)
    const submissions = await prisma.quizBlockSubmission.findMany({
      where: { id: { in: submissionIds }, trackId },
      select: { id: true, userId: true, marksReleased: true, status: true, avgScore: true },
    });

    console.log("[release-marks] 🔍 Found", submissions.length, "matching submissions");
    submissions.forEach(s => {
      console.log(`[release-marks]   - ${s.id}: userId=${s.userId}, avgScore=${s.avgScore}, status=${s.status}, currentlyReleased=${s.marksReleased}`);
    });

    if (submissions.length === 0) {
      console.log("[release-marks] ❌ No matching submissions found");
      return NextResponse.json({ error: "No matching submissions found" }, { status: 404 });
    }

    const now = new Date();

    // Update all in one transaction
    console.log("[release-marks] 💾 Updating submissions...");
    await prisma.$transaction(
      submissions.map(sub =>
        prisma.quizBlockSubmission.update({
          where: { id: sub.id },
          data: {
            marksReleased: !unreleased,
            marksReleasedAt: unreleased ? null : now,
            marksReleasedBy: unreleased ? null : user.id,
          },
        })
      )
    );
    console.log("[release-marks] ✅ Updated", submissions.length, "submissions");

    // Notify each student whose marks were just released (not un-released)
    if (!unreleased) {
      const toNotify = submissions.filter(s => !s.marksReleased && s.avgScore !== null);
      console.log("[release-marks] 🔔 Creating notifications for", toNotify.length, "students");

      await prisma.$transaction(
        toNotify.map(sub =>
          prisma.quizGradeNotification.create({
            data: {
              userId: sub.userId,
              blockSubmissionId: sub.id,
              title: "Your marks have been released!",
              message: `Your quiz results are now available. Score: ${sub.avgScore}%`,
            },
          })
        )
      );
      console.log("[release-marks] ✅ Notifications created");
    }

    console.log("[release-marks] 🎉 Success! Released:", !unreleased, "Count:", submissions.length);
    return NextResponse.json({
      ok: true,
      released: !unreleased,
      count: submissions.length,
    });
  } catch (e) {
    console.error("[release-marks]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
