/**
 * GET /api/trainer/progress
 *
 * Returns progress data for the calling trainer's assigned modules only.
 * Shows student progress across lessons, skills, and challenges in those modules.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile } from "@/lib/trainerGuard";

export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller || caller.role !== "trainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get trainer's assigned tracks
  const assignments = await prisma.trainerModule.findMany({
    where: { trainerId: caller.id },
    select: { trackId: true },
  });

  const trackIds = assignments.filter(a => a.trackId).map((a) => a.trackId!);

  if (trackIds.length === 0) {
    return NextResponse.json({
      profile: { name: null, role: "trainer" },
      streak: { current: 0, longest: 0, lastActivityDate: null },
      lessons: {
        totalAvailable: 0,
        totalCompleted: 0,
        totalStarted: 0,
        bySubject: [],
        recentlyCompleted: [],
      },
      skills: {
        totalNodes: 0,
        totalVerified: 0,
        totalDone: 0,
        byTrack: [],
      },
      challenges: { submitted: 0, scored: 0, avgScore: null, xpEarned: 0 },
      xpEvents: [],
    });
  }

  // Get all skill nodes in trainer's tracks
  const skillNodes = await prisma.skillNode.findMany({
    where: { trackId: { in: trackIds } },
    select: { id: true },
  });

  const nodeIds = skillNodes.map((n) => n.id);

  // Get all student progress on those nodes
  const allNodeProgress = await prisma.skillProgress.findMany({
    where: { nodeId: { in: nodeIds } },
    include: {
      user: { select: { id: true, name: true, role: true } },
      node: { select: { id: true, title: true, trackId: true } },
    },
  });

  // Get lessons for trainer's tracks (by subject match)
  const tracks = await prisma.skillTrack.findMany({
    where: { id: { in: trackIds } },
    select: { name: true },
  });

  const trackNames = tracks.map((t) => t.name);

  const lessonsInTracks = await prisma.lesson.findMany({
    where: { subject: { in: trackNames } },
    select: { id: true, subject: true },
  });

  const lessonIds = lessonsInTracks.map((l) => l.id);

  // Get lesson progress
  const allLessonProgress = await prisma.lessonProgress.findMany({
    where: { lessonId: { in: lessonIds } },
    include: {
      lesson: { select: { id: true, title: true, subject: true } },
    },
  });

  // Get challenges created by this trainer
  const trainerChallenges = await prisma.challenge.findMany({
    where: { trainerId: caller.id },
    select: { id: true },
  });

  const challengeIds = trainerChallenges.map((c) => c.id);

  // Get submissions to trainer's challenges
  const submissions = await prisma.challengeSubmission.findMany({
    where: { challengeId: { in: challengeIds } },
    include: { challenge: { select: { xpReward: true } } },
  });

  // Aggregate stats
  const totalNodes = nodeIds.length;
  const verifiedNodes = allNodeProgress.filter((p) => p.status === "verified").length;
  const doneNodes = allNodeProgress.filter((p) => p.status === "done").length;

  const totalLessons = lessonIds.length;
  const completedLessons = allLessonProgress.filter((p) => p.completedAt).length;
  const startedLessons = allLessonProgress.length;

  const byTrack = tracks.map((t) => {
    const nodeProgress = allNodeProgress.filter(
      (p) => skillNodes.find((n) => n.id === p.nodeId)
    );
    return {
      trackId: t.name,
      name: t.name,
      icon: null,
      total: nodeProgress.length,
      verified: nodeProgress.filter((p) => p.status === "verified").length,
      done: nodeProgress.filter((p) => p.status === "done").length,
      studying: nodeProgress.filter((p) => p.status === "studying").length,
      pct:
        nodeProgress.length > 0
          ? Math.round(
            ((nodeProgress.filter((p) => p.status === "verified" || p.status === "done")
              .length) /
              nodeProgress.length) *
            100
          )
          : 0,
    };
  });

  const avgScore =
    submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
      : null;

  const xpEarned = submissions
    .filter((s) => s.score)
    .reduce((sum, s) => {
      const multipliers: Record<number, number> = {
        1: 0.4,
        2: 0.7,
        3: 1,
        4: 1.3,
        5: 1.6,
      };
      return sum + Math.round(s.challenge.xpReward * (multipliers[s.score!] ?? 0));
    }, 0);

  return NextResponse.json({
    profile: { name: "Trainer", role: "trainer" },
    streak: { current: 0, longest: 0, lastActivityDate: null },
    lessons: {
      totalAvailable: totalLessons,
      totalCompleted: completedLessons,
      totalStarted: startedLessons,
      bySubject: trackNames.map((subj) => ({
        subject: subj,
        total: lessonsInTracks.filter((l) => l.subject === subj).length,
        completed: allLessonProgress.filter(
          (p) => p.lesson.subject === subj && p.completedAt
        ).length,
        pct: 0,
      })),
      recentlyCompleted: allLessonProgress
        .filter((p) => p.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 5)
        .map((p) => ({
          lessonId: p.lessonId,
          title: p.lesson.title,
          subject: p.lesson.subject,
          completedAt: p.completedAt?.toISOString() || null,
        })),
    },
    skills: {
      totalNodes,
      totalVerified: verifiedNodes,
      totalDone: doneNodes,
      byTrack,
    },
    challenges: {
      submitted: submissions.length,
      scored: submissions.filter((s) => s.score).length,
      avgScore,
      xpEarned,
    },
    xpEvents: [],
  });
}
