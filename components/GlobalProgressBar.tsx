"use client";

/**
 * GlobalProgressBar
 *
 * A razor-thin (3 px) progress bar pinned just below the nav.
 * It renders THREE animated segments side by side:
 *   ① Skills  (violet)   — (verified+done) / total nodes
 *   ② Lessons (sky)      — completed / available lessons
 *   ③ XP      (emerald)  — progress to next XP level
 *
 * A tooltip on hover reveals the breakdown.
 * Used in /app/(auth)/layout.tsx directly below <Nav />.
 */

import { useEffect, useRef, useState } from "react";
import { useModuleProgress } from "@/lib/useModuleProgress";

// ─── Segment ──────────────────────────────────────────────────────────────────

type Segment = {
  key:   string;
  label: string;
  pct:   number;
  color: string;
  bg:    string;
  icon:  string;
};

// ─── Thin bar fill ────────────────────────────────────────────────────────────

function BarFill({ pct, color, animate }: { pct: number; color: string; animate: boolean }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    // Tiny delay so CSS transition fires after paint
    const t = setTimeout(() => setWidth(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div
      className={`h-full ${color} transition-all duration-1000 ease-out`}
      style={{ width: `${width}%` }}
    />
  );
}

// ─── Tooltip panel ────────────────────────────────────────────────────────────

function Tooltip({
  segments,
  overallPct,
  streakDays,
  xpLevel,
}: {
  segments: Segment[];
  overallPct: number;
  streakDays: number;
  xpLevel: number;
}) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60 p-4 space-y-3 pointer-events-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-white uppercase tracking-widest">Your Progress</p>
        <div className="flex items-center gap-2 text-[10px]">
          {streakDays > 0 && (
            <span className="text-amber-400 font-bold">🔥 {streakDays}d streak</span>
          )}
          <span className="text-slate-400">Lv{xpLevel}</span>
        </div>
      </div>

      {/* Overall ring + pct */}
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 shrink-0">
          <svg className="-rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke="url(#gpb-grad)" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 18}
              strokeDashoffset={2 * Math.PI * 18 * (1 - overallPct / 100)}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gpb-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#8b5cf6" />
                <stop offset="50%"  stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-white">
            {overallPct}%
          </span>
        </div>
        <div className="flex-1 space-y-1">
          {segments.map(seg => (
            <div key={seg.key}>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="flex items-center gap-1">{seg.icon} {seg.label}</span>
                <span className="font-bold text-white">{Math.round(seg.pct)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${seg.color} transition-all duration-700`}
                  style={{ width: `${seg.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-600 text-center">
        Click Progress in the menu for the full breakdown →
      </p>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function GlobalProgressBar() {
  const { summary, loading } = useModuleProgress();
  const [hovered, setHovered] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  if (loading || !summary) {
    // Ghost bar — still renders but empty
    return (
      <div className="h-[3px] w-full bg-slate-800/60 flex overflow-hidden" aria-hidden="true">
        <div className="flex-1 bg-slate-700/30 animate-pulse" />
      </div>
    );
  }

  const segments: Segment[] = [
    {
      key:   "skills",
      label: "Skills",
      pct:   summary.skillPct,
      color: "bg-violet-500",
      bg:    "bg-violet-500/20",
      icon:  "✦",
    },
    {
      key:   "lessons",
      label: "Lessons",
      pct:   summary.lessonPct,
      color: "bg-sky-500",
      bg:    "bg-sky-500/20",
      icon:  "📚",
    },
    {
      key:   "xp",
      label: "XP Level",
      pct:   summary.xpPct,
      color: "bg-emerald-500",
      bg:    "bg-emerald-500/20",
      icon:  "⚡",
    },
  ];

  return (
    <div
      ref={barRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* The actual 3px bar */}
      <div
        className="h-[3px] w-full flex cursor-pointer overflow-hidden"
        role="progressbar"
        aria-valuenow={summary.overallPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Overall curriculum progress: ${summary.overallPct}%`}
        title="Your curriculum progress"
      >
        {segments.map(seg => (
          <div
            key={seg.key}
            className="flex-1 bg-slate-800 overflow-hidden"
          >
            <BarFill pct={seg.pct} color={seg.color} animate={!loading} />
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <Tooltip
          segments={segments}
          overallPct={summary.overallPct}
          streakDays={summary.streakDays}
          xpLevel={summary.xpLevel}
        />
      )}
    </div>
  );
}
