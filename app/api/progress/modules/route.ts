/**
 * GET /api/progress/modules
 *
 * Returns per-module progress for the authenticated student, filtered to
 * only the tracks that belong to their level (role) AND department.
 *
 * Computes:
 *  - completionPct, readPct, status breakdown
 *  - estimatedTimeMinutes  (sum of node.estimatedMinutes)
 *  - timeSpentMinutes      (estimatedMinutes × readPct/100 per node, summed)
 *  - firstVisit            (earliest SkillProgress.createdAt)
 *  - lastVisit             (latest  SkillProgress.updatedAt)
 *  - daysActive            (count of distinct calendar dates from updatedAt list)
 *  - streak                (from StudentStreak)
 *  - quiz stats
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
    select: {
      id: true, role: true, status: true, name: true,
      xp: true, department: true, level: true,
      streak: { select: { currentStreak: true, longestStreak: true, lastActivityDate: true } },
    },
  });

  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Build track filter ────────────────────────────────────────────────────
  // A track is visible to a student when:
  //   • its tier matches the student's role OR is "all"
  //   AND
  //   • its department matches the student's department OR is null/empty (common to all)
  const tierFilter = [{ tier: "all" }, { tier: profile.role }];

  // Department filter: show tracks with no department OR matching the student's department
  const departmentFilter = profile.department
    ? [{ department: null }, { department: "" }, { department: profile.department }]
    : [{ department: null }, { department: "" }]; // no department on profile → only common tracks

  const modules = await prisma.skillTrack.findMany({
    where: {
      AND: [
        { OR: tierFilter },
        { OR: departmentFilter },
      ],
    },
    orderBy: { order: "asc" },
    include: {
      nodes: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { userId: profile.id },
          },
        },
      },
      quizSubmissions: {
        where: { userId: profile.id },
        select: { id: true, avgScore: true, status: true, createdAt: true, updatedAt: true },
      },
    },
  });

  // ── Per-module analytics ──────────────────────────────────────────────────
  const moduleProgress = modules.map(module => {
    const nodes = module.nodes;
    const total = nodes.length;

    const completed = nodes.filter(n => ["done", "verified"].includes(n.progress[0]?.status ?? "")).length;
    const verified = nodes.filter(n => n.progress[0]?.status === "verified").length;
    const inProgress = nodes.filter(n => n.progress[0]?.status === "studying").length;
    const notStarted = total - completed - inProgress;

    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgReadPct = total > 0
      ? Math.round(nodes.reduce((s, n) => s + (n.progress[0]?.readPct ?? 0), 0) / total)
      : 0;

    // Time estimates
    const estimatedTimeMinutes = nodes.reduce((s, n) => s + (n.estimatedMinutes ?? 0), 0);
    const timeSpentMinutes = nodes.reduce((s, n) => {
      const pct = (n.progress[0]?.readPct ?? 0) / 100;
      return s + Math.round((n.estimatedMinutes ?? 0) * pct);
    }, 0);

    // Visit history
    const progressRecords = nodes.flatMap(n => n.progress);
    const visitDates = progressRecords.map(p => p.updatedAt).filter(Boolean);
    const createDates = progressRecords.map(p => p.createdAt).filter(Boolean);

    const lastVisit = visitDates.length
      ? new Date(Math.max(...visitDates.map(d => new Date(d).getTime()))).toISOString()
      : null;
    const firstVisit = createDates.length
      ? new Date(Math.min(...createDates.map(d => new Date(d).getTime()))).toISOString()
      : null;

    // Days active = distinct calendar dates (UTC) across all updatedAt timestamps
    const daySet = new Set(visitDates.map(d => new Date(d).toISOString().slice(0, 10)));
    const daysActive = daySet.size;

    // Quiz stats
    const quizSubs = module.quizSubmissions;
    const gradedQuizzes = quizSubs.filter(q => q.avgScore !== null);
    const avgQuizScore = gradedQuizzes.length
      ? Math.round(gradedQuizzes.reduce((s, q) => s + (q.avgScore ?? 0), 0) / gradedQuizzes.length)
      : null;

    // XP
    const xpEarned = nodes.filter(n => n.progress[0]?.status === "verified").reduce((s, n) => s + n.xpReward, 0);
    const totalXp = nodes.reduce((s, n) => s + n.xpReward, 0);

    return {
      id: module.id,
      name: module.name,
      description: module.description,
      icon: module.icon,
      tier: module.tier,
      department: module.department,

      // counts
      total,
      completed,
      verified,
      inProgress,
      notStarted,

      // percentages
      completionPct,
      avgReadPct,

      // time
      estimatedTimeMinutes,
      timeSpentMinutes,

      // activity
      firstVisit,
      lastVisit,
      daysActive,

      // quiz
      totalQuizSubmissions: quizSubs.length,
      gradedQuizzes: gradedQuizzes.length,
      avgQuizScore,

      // xp
      xpEarned,
      totalXp,

      // node detail
      nodes: nodes.map(node => ({
        id: node.id,
        title: node.title,
        estimatedMinutes: node.estimatedMinutes,
        xpReward: node.xpReward,
        status: node.progress[0]?.status ?? "not_started",
        readPct: node.progress[0]?.readPct ?? 0,
        verifiedAt: node.progress[0]?.verifiedAt?.toISOString() ?? null,
        firstVisit: node.progress[0]?.createdAt?.toISOString() ?? null,
        lastVisit: node.progress[0]?.updatedAt?.toISOString() ?? null,
        timeSpentMinutes: Math.round((node.estimatedMinutes ?? 0) * ((node.progress[0]?.readPct ?? 0) / 100)),
      })),
    };
  });

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalModules = moduleProgress.length;
  const startedModules = moduleProgress.filter(m => m.avgReadPct > 0).length;
  const completedModules = moduleProgress.filter(m => m.completionPct === 100).length;
  const totalTimeEstMin = moduleProgress.reduce((s, m) => s + m.estimatedTimeMinutes, 0);
  const totalTimeSpentMin = moduleProgress.reduce((s, m) => s + m.timeSpentMinutes, 0);
  const overallPct = moduleProgress.reduce((s, m) => s + m.completionPct, 0) / Math.max(totalModules, 1);

  return NextResponse.json({
    profile: {
      name: profile.name,
      role: profile.role,
      department: profile.department,
      level: profile.level,
      xp: profile.xp,
      streak: profile.streak ?? { currentStreak: 0, longestStreak: 0, lastActivityDate: null },
    },
    summary: {
      totalModules,
      startedModules,
      completedModules,
      overallPct: Math.round(overallPct),
      totalTimeEstMin,
      totalTimeSpentMin,
    },
    modules: moduleProgress,
  });
}
