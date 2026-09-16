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
    select: { id: true, status: true, role: true },
  });

  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only teachers and admins can approve
  if (!["admin", "trainer"].includes(profile.role)) {
    return NextResponse.json({ error: "Only teachers can approve join requests" }, { status: 403 });
  }

  const { projectId } = params;
  const body = await request.json();
  const { userId, action } = body; // action: "approve" or "reject"

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
  }

  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  // Check if project exists and requester is the creator or admin
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdBy: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Only project creator or admin can approve
  if (project.createdBy !== profile.id && profile.role !== "admin") {
    return NextResponse.json({ error: "Only the project creator can approve requests" }, { status: 403 });
  }

  // Find the pending request
  const memberRequest = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!memberRequest) {
    return NextResponse.json({ error: "Join request not found" }, { status: 404 });
  }

  if (memberRequest.status !== "pending") {
    return NextResponse.json(
      { error: `Request is already ${memberRequest.status}` },
      { status: 400 }
    );
  }

  // Update the request status
  await prisma.projectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      approvedAt: action === "approve" ? new Date() : null,
      approvedBy: action === "approve" ? profile.id : null,
    },
  });

  return NextResponse.json({
    success: true,
    message: action === "approve" 
      ? "Join request approved! Student can now collaborate."
      : "Join request rejected.",
    action,
  });
}
