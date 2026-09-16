import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import MyResultsClient from "@/components/MyResultsClient";

export default async function MyResultsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { name: true, role: true, status: true, email: true },
  });
  if (!profile || profile.status !== "approved") redirect("/dashboard");

  // Only fetch submissions where teacher has released marks
  const submissions = await prisma.quizBlockSubmission.findMany({
    where: {
      userId: user.id,
      status: "graded",
      avgScore: { not: null },
      marksReleased: true,
    },
    include: {
      node: { select: { id: true, title: true } },
      track: { select: { id: true, name: true, tier: true, icon: true } },
    },
    orderBy: { marksReleasedAt: "desc" },
  });

  const submissionsWithResponses = await Promise.all(
    submissions.map(async (sub) => {
      const responses = await prisma.quizResponse.findMany({
        where: { userId: user.id, nodeId: sub.nodeId, blockId: sub.blockId },
        orderBy: { questionIdx: "asc" },
        select: {
          id: true, questionIdx: true, questionType: true,
          answerText: true, answerChoice: true,
          gradeScore: true, gradeNotes: true, gradedAt: true, autoGraded: true,
        },
      });
      return {
        ...sub,
        responses,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
        marksReleasedAt: sub.marksReleasedAt?.toISOString() ?? null,
      };
    })
  );

  // Count submissions graded but not yet released — student sees a "waiting" count
  const pendingRelease = await prisma.quizBlockSubmission.count({
    where: {
      userId: user.id,
      status: "graded",
      avgScore: { not: null },
      marksReleased: false,
    },
  });

  // Fetch project grades
  const projectSubmissions = await prisma.projectSubmission.findMany({
    where: {
      userId: user.id,
      grade: { not: null }, // Only show graded projects
    },
    include: {
      user: {
        select: { name: true },
      },
    },
    orderBy: { gradedAt: "desc" },
  });

  // Fetch project details for each submission
  const projectSubmissionsWithDetails = await Promise.all(
    projectSubmissions.map(async (sub) => {
      const project = await prisma.project.findUnique({
        where: { id: sub.projectId },
        select: { id: true, title: true, description: true },
      });
      return {
        ...sub,
        project,
        submittedAt: sub.submittedAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
        gradedAt: sub.gradedAt?.toISOString() ?? null,
      };
    })
  );

  return (
    <MyResultsClient
      student={{ name: profile.name, email: user.email ?? "" }}
      submissions={submissionsWithResponses as any}
      projectSubmissions={projectSubmissionsWithDetails as any}
      pendingRelease={pendingRelease}
    />
  );
}
