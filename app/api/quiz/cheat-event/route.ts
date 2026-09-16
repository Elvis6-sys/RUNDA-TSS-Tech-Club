import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { submissionId, studentName, nodeTitle, trackId, event, autoSubmitted } =
      await req.json() as {
        submissionId: string;
        studentName: string;
        nodeTitle: string;
        trackId: string;
        event: { type: string; timestamp: string };
        autoSubmitted: boolean;
      };

    // Update submission: increment cheat attempts and append to log
    const submission = await prisma.quizBlockSubmission.findUnique({
      where: { id: submissionId },
      select: { cheatAttempts: true, cheatLog: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const currentLog = submission.cheatLog ? JSON.parse(submission.cheatLog) : [];
    const newLog = [...currentLog, event];
    const newAttempts = submission.cheatAttempts + 1;

    await prisma.quizBlockSubmission.update({
      where: { id: submissionId },
      data: {
        cheatAttempts: newAttempts,
        cheatLog: JSON.stringify(newLog),
        autoSubmitted: autoSubmitted || undefined,
        status: autoSubmitted ? "submitted" : undefined,
      },
    });

    // Create a CheatNotification for the teacher
    await prisma.cheatNotification.create({
      data: {
        trackId,
        studentId: user.id,
        blockSubmissionId: submissionId,
        studentName,
        nodeTitle,
        attemptNumber: newAttempts,
        autoSubmitted,
      },
    });

    return NextResponse.json({ ok: true, attempts: newAttempts });
  } catch (e) {
    console.error("[cheat-event]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET — fetch cheat notifications for a track (teacher view)
export async function GET(req: NextRequest) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trackId = req.nextUrl.searchParams.get("trackId");
    if (!trackId) return NextResponse.json({ error: "trackId required" }, { status: 400 });

    const notifications = await prisma.cheatNotification.findMany({
      where: { trackId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ notifications });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
