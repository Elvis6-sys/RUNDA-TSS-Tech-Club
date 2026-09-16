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

    const submissionId = req.nextUrl.searchParams.get("submissionId");
    if (!submissionId) return NextResponse.json({ error: "submissionId required" }, { status: 400 });

    const submission = await prisma.quizBlockSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!(await canManageTrack(caller, submission.trackId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const responses = await prisma.quizResponse.findMany({
      where: {
        userId: submission.userId,
        nodeId: submission.nodeId,
        blockId: submission.blockId,
      },
      orderBy: { questionIdx: "asc" },
    });

    return NextResponse.json({ responses });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
