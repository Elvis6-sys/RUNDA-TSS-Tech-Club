"use client";

/**
 * useModuleProgress
 *
 * Fetches /api/progress once on mount, exposes a helper to look up per-track
 * and per-node completion percentages, and lets any component subscribe to
 * live progress data without prop-drilling.
 *
 * Used by: GlobalProgressBar, PassportClient, TrainerModuleViewer
 */

import { useEffect, useState, useCallback } from "react";

// ─── Shape mirrors /api/progress response ────────────────────────────────────

export type TrackProgress = {
  trackId: string;
  name: string;
  icon: string | null;
  total: number;
  verified: number;
  done: number;
  studying: number;
  pct: number;          // (verified + done) / total * 100
};

export type ProgressData = {
  profile: { name: string | null; role: string; xp: number };
  streak: { current: number; longest: number; lastActivityDate: string | null };
  lessons: {
    totalAvailable: number;
    totalCompleted: number;
    bySubject: { subject: string; total: number; completed: number; pct: number }[];
  };
  skills: {
    totalNodes: number;
    totalVerified: number;
    totalDone: number;
    byTrack: TrackProgress[];
  };
  challenges: { submitted: number; scored: number; avgScore: number | null; xpEarned: number };
  xpEvents: { amount: number; reason: string; createdAt: string }[];
};

// ─── Overall summary derived from ProgressData ───────────────────────────────

export type ProgressSummary = {
  overallPct: number;          // weighted across lessons + skills
  lessonPct: number;
  skillPct: number;
  xpLevel: number;
  xpToNext: number;
  xpPct: number;
  streakDays: number;
  byTrack: TrackProgress[];
  bySubject: { subject: string; pct: number; completed: number; total: number }[];
};

// ─── XP helpers ──────────────────────────────────────────────────────────────

const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

export function xpInfo(xp: number) {
  let lvl = 0;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) if (xp >= XP_THRESHOLDS[i]) lvl = i + 1;
  const current = XP_THRESHOLDS[Math.min(lvl - 1, XP_THRESHOLDS.length - 1)];
  const next    = XP_THRESHOLDS[Math.min(lvl,     XP_THRESHOLDS.length - 1)];
  const pct     = next > current ? Math.round(((xp - current) / (next - current)) * 100) : 100;
  return { level: lvl, current, next, pct, toNext: next - xp };
}

// ─── Derive summary ───────────────────────────────────────────────────────────

function deriveSummary(d: ProgressData): ProgressSummary {
  const lessonPct =
    d.lessons.totalAvailable > 0
      ? Math.round((d.lessons.totalCompleted / d.lessons.totalAvailable) * 100)
      : 0;

  const skillPct =
    d.skills.totalNodes > 0
      ? Math.round(((d.skills.totalVerified + d.skills.totalDone) / d.skills.totalNodes) * 100)
      : 0;

  // Weight: 40% lessons, 60% skills (skills require more active work)
  const overallPct = Math.round(lessonPct * 0.4 + skillPct * 0.6);

  const xp = xpInfo(d.profile.xp);

  return {
    overallPct,
    lessonPct,
    skillPct,
    xpLevel:    xp.level,
    xpToNext:   xp.toNext,
    xpPct:      xp.pct,
    streakDays: d.streak.current,
    byTrack:    d.skills.byTrack,
    bySubject:  d.lessons.bySubject,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useModuleProgress() {
  const [raw,     setRaw]     = useState<ProgressData | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) { setError(true); return; }
      const data: ProgressData = await res.json();
      setRaw(data);
      setSummary(deriveSummary(data));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => { load(); }, [load]);

  // Re-fetch whenever the user returns to the tab (they may have just completed something)
  useEffect(() => {
    const handler = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [load]);

  /** Look up a single track's progress by trackId */
  function trackPct(trackId: string): number {
    return summary?.byTrack.find(t => t.trackId === trackId)?.pct ?? 0;
  }

  return { raw, summary, loading, error, refresh: load, trackPct };
}
