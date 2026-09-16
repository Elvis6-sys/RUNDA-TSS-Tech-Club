import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { id: true, status: true, name: true },
  });

  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { projectId } = params;
  const body = await request.json();
  const { submissionUrl, note, fileUrl, fileName, fileType } = body;

  if (!submissionUrl || typeof submissionUrl !== "string") {
    return NextResponse.json({ error: "Submission URL is required" }, { status: 400 });
  }

  // Check if project exists and user is a member
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: profile.id },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.members.length === 0) {
    return NextResponse.json(
      { error: "You must be a member of this project to submit work" },
      { status: 403 }
    );
  }

  // Check if membership is approved
  if (project.members[0].status !== "approved") {
    return NextResponse.json(
      { error: "Your join request must be approved before you can submit work" },
      { status: 403 }
    );
  }

  // Create or update the submission
  const submission = await prisma.projectSubmission.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId: profile.id,
      },
    },
    update: {
      submissionUrl,
      note: note || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null,
      updatedAt: new Date(),
    },
    create: {
      projectId,
      userId: profile.id,
      submissionUrl,
      note: note || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null,
    },
  });

  // Award XP only on first submission (when created)
  const isFirstSubmission = submission.submittedAt.getTime() === submission.updatedAt.getTime();

  if (isFirstSubmission) {
    await prisma.xpEvent.create({
      data: {
        userId: profile.id,
        amount: 20,
        reason: "project_submission",
        refId: projectId,
      },
    });

    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { xp: { increment: 20 } },
    });
  }

  return NextResponse.json({
    success: true,
    message: isFirstSubmission
      ? "Work submitted successfully! +20 Points earned"
      : "Work updated successfully!",
    xpEarned: isFirstSubmission ? 20 : 0,
    submission,
  });
}
