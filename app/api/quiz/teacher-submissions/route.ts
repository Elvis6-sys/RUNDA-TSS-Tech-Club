/**
 * GET /api/quiz/teacher-submissions?trackId=...&since=...
 *
 * Returns all quiz block submissions for a track, including student info.
 * Used by EnhancedQuizGradingDashboard to poll for new submissions and
 * notify the teacher in real-time.
 *
 * Query params:
 *   trackId  — required — the skill track the teacher manages
 *   since    — optional ISO timestamp — only return submissions newer than this
 *              (used for polling: pass the timestamp of the last known submission)
 */
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only trainers / admins may access this endpoint
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (!profile || !["trainer", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trackId = req.nextUrl.searchParams.get("trackId");
    const since   = req.nextUrl.searchParams.get("since"); // ISO string

    if (!trackId) {
      return NextResponse.json({ error: "trackId is required" }, { status: 400 });
    }

    // Verify the teacher actually manages this track
    const track = await prisma.skillTrack.findUnique({
      where: { id: trackId },
      select: { trainerId: true, name: true },
    });
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    if (track.trainerId !== user.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build the filter — support incremental polling via `since`
    const sinceDate = since ? new Date(since) : undefined;

    const submissions = await prisma.quizBlockSubmission.findMany({
      where: {
        trackId,
        ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            cohort: true,
            department: true,
          },
        },
        node: {
          select: { id: true, title: true },
        },
        // Include individual responses so teacher can grade inline
        gradeNotifications: {
          select: { id: true, read: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Count unread (new) submissions — those created after `since`
    const newCount = sinceDate
      ? submissions.filter(s => s.createdAt > sinceDate).length
      : submissions.length;

    // Shape for the client
    const shaped = submissions.map(s => ({
      id: s.id,
      status: s.status,
      totalQuestions: s.totalQuestions,
      gradedCount: s.gradedCount,
      avgScore: s.avgScore,
      autoSubmitted: s.autoSubmitted,
      cheatAttempts: s.cheatAttempts,
      marksReleased: s.marksReleased,
      marksReleasedAt: s.marksReleasedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      // Student info
      student: {
        id: s.user.id,
        name: s.user.name ?? s.user.email ?? "Unknown",
        email: s.user.email,
        profileImage: s.user.profileImage,
        cohort: s.user.cohort,
        department: s.user.department,
      },
      // Quiz / node info
      nodeId: s.nodeId,
      blockId: s.blockId,
      nodeTitle: s.node?.title ?? "Quiz",
      trackId: s.trackId,
      trackName: track.name,
      // Whether this submission is brand-new (newer than `since`)
      isNew: sinceDate ? s.createdAt > sinceDate : false,
    }));

    return NextResponse.json({
      submissions: shaped,
      total: shaped.length,
      newCount,
      trackName: track.name,
    });
  } catch (e) {
    console.error("[teacher-submissions]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
