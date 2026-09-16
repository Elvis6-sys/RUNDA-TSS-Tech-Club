import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  // Fetch submissions for all projects
  const projectIds = projects.map(p => p.id);
  const submissions = await prisma.projectSubmission.findMany({
    where: {
      projectId: { in: projectIds },
    },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  // Map submissions to projects
  const projectsWithSubmissions = projects.map(project => ({
    ...project,
    submissions: submissions.filter(s => s.projectId === project.id),
  }));

  return NextResponse.json(projectsWithSubmissions);
}

export async function POST(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: user!.id } });
  if (!profile || !["admin", "trainer"].includes(profile.role)) {
    return NextResponse.json({ error: "Only admins and teachers can create projects." }, { status: 403 });
  }

  const { title, description, tierVisibility } = await request.json();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      title,
      description: description || null,
      tierVisibility: tierVisibility || "all",
      createdBy: user!.id,
      status: "active"
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    ...project,
    createdAt: project.createdAt,
    members: project.members.map((m) => ({
      ...m,
      requestedAt: m.requestedAt,
      approvedAt: m.approvedAt,
    })),
  });
}
