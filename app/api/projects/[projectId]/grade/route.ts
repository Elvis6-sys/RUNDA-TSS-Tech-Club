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
    select: { id: true, status: true, role: true, name: true },
  });

  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { projectId } = params;
  const body = await request.json();
  const { studentId, grade, feedback, status } = body;

  // Validate inputs
  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
  }

  if (grade !== null && grade !== undefined) {
    if (typeof grade !== "number" || grade < 0 || grade > 100) {
      return NextResponse.json({ error: "Grade must be between 0 and 100" }, { status: 400 });
    }
  }

  const validStatuses = ["submitted", "graded", "revision_requested"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  // Check if project exists and user is the creator or admin
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdBy: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Only project creator or admin can grade
  if (project.createdBy !== profile.id && profile.role !== "admin") {
    return NextResponse.json(
      { error: "Only the project creator can grade submissions" },
      { status: 403 }
    );
  }

  // Check if submission exists
  const submission = await prisma.projectSubmission.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: studentId,
      },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Update the submission with grade and feedback
  const updatedSubmission = await prisma.projectSubmission.update({
    where: {
      projectId_userId: {
        projectId,
        userId: studentId,
      },
    },
    data: {
      grade: grade !== undefined ? grade : submission.grade,
      feedback: feedback !== undefined ? feedback : submission.feedback,
      gradedBy: profile.id,
      gradedAt: new Date(),
      status: status || "graded",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: "Submission graded successfully",
    submission: {
      ...updatedSubmission,
      submittedAt: updatedSubmission.submittedAt,
      updatedAt: updatedSubmission.updatedAt,
      gradedAt: updatedSubmission.gradedAt,
    },
  });
}
