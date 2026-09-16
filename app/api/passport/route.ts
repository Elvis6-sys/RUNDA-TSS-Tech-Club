import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user!.id },
    select: { xp: true, role: true, name: true, cohort: true, level: true },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tracks = await prisma.skillTrack.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      department: true,
      tier: true,
      icon: true,
      order: true,
      trainerId: true,
      curriculumType: true,
      curriculumUrl: true,
      moduleSlug: true,
      tableOfContents: true,
      nodes: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          xpReward: true,
          order: true,
          prerequisiteId: true,
          estimatedMinutes: true,
          videoUrl: true,
          progress: {
            where: { userId: user!.id },
            select: {
              status: true,
              verifiedBy: true,
              evidenceUrl: true,
            },
          },
        },
      },
    },
  });

  // Count verified skills for passport stamp
  const verifiedCount = await prisma.skillProgress.count({
    where: { userId: user!.id, status: "verified" },
  });

  return NextResponse.json({ profile, tracks, verifiedCount });
}
