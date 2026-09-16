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

  // Check if project exists
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

  // Check if already has a request (pending, approved, or rejected)
  if (project.members.length > 0) {
    const existingStatus = project.members[0].status;
    if (existingStatus === "approved") {
      return NextResponse.json({ error: "You are already a member of this project" }, { status: 400 });
    } else if (existingStatus === "pending") {
      return NextResponse.json({ error: "You already have a pending join request for this project" }, { status: 400 });
    } else if (existingStatus === "rejected") {
      return NextResponse.json({ error: "Your previous join request was rejected" }, { status: 400 });
    }
  }

  // Create pending join request
  await prisma.projectMember.create({
    data: {
      projectId,
      userId: profile.id,
      roleInProject: "member",
      status: "pending",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Join request sent! Waiting for teacher approval.",
    status: "pending"
  });
}
