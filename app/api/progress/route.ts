import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    include: { streak: true },
  });
  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Lessons ───────────────────────────────────────────────────────────────
  const allLessons = await prisma.lesson.findMany({
    where: { OR: [{ tierVisibility: "all" }, { tierVisibility: profile.role }] },
    select: { id: true, title: true, subject: true },
  });

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { studentId: profile.id },
    select: {
      lessonId: true,
      completedAt: true,
      lastReadAt: true,
      lesson: { select: { title: true, subject: true } },
    },
  });

  const completedIds = new Set(
    lessonProgress.filter((p) => p.completedAt).map((p) => p.lessonId)
  );

  const subjectMap: Record<string, { total: number; completed: number }> = {};
  for (const l of allLessons) {
    if (!subjectMap[l.subject]) subjectMap[l.subject] = { total: 0, completed: 0 };
    subjectMap[l.subject].total++;
    if (completedIds.has(l.id)) subjectMap[l.subject].completed++;
  }

  const lessonsBySubject = Object.entries(subjectMap).map(([subject, counts]) => ({
    subject,
    ...counts,
    pct: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
  }));

  const recentlyCompleted = lessonProgress
    .filter((p) => p.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5)
    .map((p) => ({
      lessonId: p.lessonId,
      title: p.lesson.title,
      subject: p.lesson.subject,
      completedAt: p.completedAt,
    }));

  // ── Passport / Skills ─────────────────────────────────────────────────────
  const tracks = await prisma.skillTrack.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
      nodes: {
        select: {
          id: true,
          progress: {
            where: { userId: profile.id },
            select: { status: true },
          },
        },
      },
    },
  });

  const skillsByTrack = tracks.map((t) => {
    const total = t.nodes.length;
    const verified = t.nodes.filter((n) => n.progress[0]?.status === "verified").length;
    const done = t.nodes.filter((n) => n.progress[0]?.status === "done").length;
    const studying = t.nodes.filter((n) => n.progress[0]?.status === "studying").length;
    const pct = total > 0 ? Math.round(((verified + done) / total) * 100) : 0;
    return { trackId: t.id, name: t.name, icon: t.icon, total, verified, done, studying, pct };
  });

  // ── Challenges ────────────────────────────────────────────────────────────
  const submissions = await prisma.challengeSubmission.findMany({
    where: { userId: profile.id },
    select: {
      score: true,
      challenge: { select: { xpReward: true, title: true } },
    },
  });

  const scored = submissions.filter((s) => s.score !== null);
  const avgScore =
    scored.length > 0
      ? Math.round((scored.reduce((sum, s) => sum + s.score!, 0) / scored.length) * 10) / 10
      : null;
  const xpFromChallenges = scored.reduce((sum, s) => sum + s.challenge.xpReward, 0);

  // ── XP log (last 10) ──────────────────────────────────────────────────────
  const xpEvents = await prisma.xpEvent.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { amount: true, reason: true, createdAt: true },
  });

  return NextResponse.json({
    profile: { name: profile.name, role: profile.role, xp: profile.xp },
    streak: profile.streak
      ? {
        current: profile.streak.currentStreak,
        longest: profile.streak.longestStreak,
        lastActivityDate: profile.streak.lastActivityDate,
      }
      : { current: 0, longest: 0, lastActivityDate: null },
    lessons: {
      totalAvailable: allLessons.length,
      totalCompleted: completedIds.size,
      totalStarted: lessonProgress.length,
      bySubject: lessonsBySubject,
      recentlyCompleted,
    },
    skills: {
      totalNodes: tracks.reduce((s, t) => s + t.nodes.length, 0),
      totalVerified: skillsByTrack.reduce((s, t) => s + t.verified, 0),
      totalDone: skillsByTrack.reduce((s, t) => s + t.done, 0),
      byTrack: skillsByTrack,
    },
    challenges: {
      submitted: submissions.length,
      scored: scored.length,
      avgScore,
      xpEarned: xpFromChallenges,
    },
    xpEvents,
  });
}
