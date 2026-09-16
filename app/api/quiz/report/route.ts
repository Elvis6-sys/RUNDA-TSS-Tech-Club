import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";

export async function GET(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const caller = await getCallerProfile(user.id);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trackId = req.nextUrl.searchParams.get("trackId");
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });

    if (!(await canManageTrack(caller, trackId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all submissions with their student info
    const submissions = await prisma.quizBlockSubmission.findMany({
      where: { trackId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        node: { select: { id: true, title: true } },
      },
      orderBy: [{ userId: "asc" }, { createdAt: "desc" }],
    });

    // Fetch all responses for this track in one query
    const nodeIds = [...new Set(submissions.map(s => s.nodeId))];
    const allResponses = nodeIds.length > 0
      ? await prisma.quizResponse.findMany({
        where: { nodeId: { in: nodeIds } },
        select: {
          id: true, userId: true, nodeId: true, blockId: true,
          questionIdx: true, questionType: true, answerText: true,
          answerChoice: true, gradeScore: true, gradeNotes: true, gradedAt: true,
        },
        orderBy: { questionIdx: "asc" },
      })
      : [];

    // Map responses to submissions
    const submissionsWithResponses = submissions.map(sub => ({
      ...sub,
      responses: allResponses.filter(
        r => r.userId === sub.userId && r.nodeId === sub.nodeId && r.blockId === sub.blockId
      ),
    }));

    // Fetch cheat notifications for this track
    const cheatNotifications = await prisma.cheatNotification.findMany({
      where: { trackId },
      orderBy: { createdAt: "desc" },
    });

    // Build per-student report
    const studentMap: Record<string, {
      student: { id: string; name: string | null; email: string };
      submissions: typeof submissions;
      totalAttempts: number;
      averageScore: number | null;
      cheatFlags: number;
      autoSubmissions: number;
    }> = {};

    for (const sub of submissionsWithResponses) {
      const sid = sub.userId;
      if (!studentMap[sid]) {
        studentMap[sid] = {
          student: sub.user,
          submissions: [],
          totalAttempts: 0,
          averageScore: null,
          cheatFlags: 0,
          autoSubmissions: 0,
        };
      }
      studentMap[sid].submissions.push(sub as any);
      studentMap[sid].totalAttempts++;
      if (sub.autoSubmitted) studentMap[sid].autoSubmissions++;
      studentMap[sid].cheatFlags += sub.cheatAttempts;
    }

    // Calculate per-student averages
    for (const sid of Object.keys(studentMap)) {
      const gradedSubs = studentMap[sid].submissions.filter(s => s.avgScore !== null);
      if (gradedSubs.length > 0) {
        const total = gradedSubs.reduce((sum, s) => sum + (s.avgScore ?? 0), 0);
        studentMap[sid].averageScore = Math.round(total / gradedSubs.length);
      }
    }

    return NextResponse.json({
      students: Object.values(studentMap),
      cheatNotifications,
      totalSubmissions: submissions.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
