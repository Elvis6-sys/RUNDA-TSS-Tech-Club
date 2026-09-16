/**
 * GET /api/trainer/dashboard
 *
 * Returns the calling trainer's assigned tracks with their nodes, plus a
 * summary of lessons, resources, and challenges they own.
 *
 * Accessible by trainers (and admins for previewing any trainer's data).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true, status: true, name: true },
  });

  if (!profile || !["trainer", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const trainerId = user.id;

  // Assigned tracks with their nodes - grouped by department and tier
  const assignments = await prisma.trainerModule.findMany({
    where: { trainerId },
    include: {
      track: {
        include: {
          nodes: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              estimatedMinutes: true,
              xpReward: true,
              order: true,
            },
          },
        },
      },
      module: {
        select: {
          id: true,
          code: true,
          name: true,
          department: true,
          level: true,
          category: true,
          pdfPath: true,
        },
      },
    },
    orderBy: [
      { track: { tier: "asc" } },
      { track: { name: "asc" } },
    ],
  });

  // Get all SkillTracks that are linked to CurriculumModules (to avoid showing duplicates)
  const linkedTrackIds = assignments
    .filter(a => a.module)
    .map(a => a.module!.code.toLowerCase());

  // Lessons, resources, challenges owned by this trainer
  const [lessons, resources, challenges] = await Promise.all([
    prisma.lesson.findMany({
      where: { trainerId },
      orderBy: [{ subject: "asc" }, { order: "asc" }],
      select: { id: true, title: true, subject: true, tierVisibility: true, updatedAt: true },
    }),
    prisma.resource.findMany({
      where: { trainerId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, subject: true, tierVisibility: true, createdAt: true },
    }),
    prisma.challenge.findMany({
      where: { trainerId },
      orderBy: { dueDate: "desc" },
      select: {
        id: true, title: true, tier: true, status: true, dueDate: true,
        _count: { select: { submissions: true } },
      },
    }),
  ]);

  return NextResponse.json({
    profile: { name: profile.name, role: profile.role },
    assignments: assignments.map((a) => {
      // For SkillTracks: only show if NOT linked to a CurriculumModule
      if (a.track) {
        // Skip SkillTracks that are created from CurriculumModules (they'll show as CurriculumModules instead)
        if (a.track.moduleSlug && linkedTrackIds.includes(a.track.moduleSlug)) {
          return null; // Will be filtered out
        }

        return {
          type: 'skill_track',
          assignedAt: a.assignedAt,
          track: {
            ...a.track,
            createdAt: a.track.createdAt.toISOString(),
          },
        };
      }
      // For CurriculumModules (convert to track-like structure)
      if (a.module) {
        return {
          type: 'curriculum_module',
          assignedAt: a.assignedAt,
          track: {
            id: a.module.id,
            name: a.module.name,
            description: `${a.module.code} - ${a.module.category}`,
            department: a.module.department,
            tier: a.module.level,
            moduleCode: a.module.code,
            pdfPath: a.module.pdfPath,
            nodes: [],
            createdAt: new Date().toISOString(),
          },
        };
      }
      return null;
    }).filter(Boolean),
    lessons,
    resources,
    challenges,
  });
}
