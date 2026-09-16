import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ProjectSubmissionsClient from "@/components/ProjectSubmissionsClient";

export default async function ProjectSubmissionsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, status: true, name: true },
  });

  if (!profile || profile.status !== "approved") {
    redirect("/dashboard");
  }

  // Fetch project with creator info
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      members: {
        where: { status: "approved" },
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

  if (!project) {
    redirect("/projects");
  }

  // Check if user is project creator or admin
  const isCreator = project.createdBy === profile.id;
  const isAdmin = profile.role === "admin";

  if (!isCreator && !isAdmin) {
    redirect("/projects");
  }

  // Fetch submissions
  const submissions = await prisma.projectSubmission.findMany({
    where: { projectId: params.projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <ProjectSubmissionsClient
      project={{
        ...project,
        createdAt: project.createdAt,
        members: project.members.map((m) => ({
          ...m,
          requestedAt: m.requestedAt,
          approvedAt: m.approvedAt,
        })),
      }}
      submissions={submissions.map((s) => ({
        ...s,
        submittedAt: s.submittedAt,
        updatedAt: s.updatedAt,
        gradedAt: s.gradedAt,
      }))}
      userId={profile.id}
      userName={profile.name || "Unknown"}
      isCreator={isCreator}
      isAdmin={isAdmin}
    />
  );
}
