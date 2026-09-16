"use client";

/**
 * ProgressClient — Professional student progress dashboard.
 *
 * Features:
 *  • Filtered to student's level + department only
 *  • Overview stats: overall %, time spent, days active, streak, XP
 *  • Per-module cards: circular ring progress, time spent vs estimated,
 *    last visit, days active, quiz score
 *  • Expandable node-level detail with status chips + per-node time + read %
 *  • Status legend, tier badge, responsive layout
 */

import { useEffect, useState } from "react";
import {
  Trophy, Target, Clock, BookOpen, CheckCircle2, AlertCircle,
  Flame, Zap, ChevronDown, ChevronRight, Calendar, TrendingUp,
  Award, BarChart3, Play, RotateCcw, CheckSquare, Star,
  GraduationCap, Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeProgress = {
  id: string;
  title: string;
  estimatedMinutes: number;
  xpReward: number;
  status: string;
  readPct: number;
  verifiedAt: string | null;
  firstVisit: string | null;
  lastVisit: string | null;
  timeSpentMinutes: number;
};

type ModuleProgress = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  tier: string;
  department: string | null;
  total: number;
  completed: number;
  verified: number;
  inProgress: number;
  notStarted: number;
  completionPct: number;
  avgReadPct: number;
  estimatedTimeMinutes: number;
  timeSpentMinutes: number;
  firstVisit: string | null;
  lastVisit: string | null;
  daysActive: number;
  totalQuizSubmissions: number;
  gradedQuizzes: number;
  avgQuizScore: number | null;
  xpEarned: number;
  totalXp: number;
  nodes: NodeProgress[];
};

type Data = {
  profile: {
    name: string | null;
    role: string;
    department: string | null;
    level: string | null;
    xp: number;
    streak: { currentStreak: number; longestStreak: number; lastActivityDate: string | null };
  };
  summary: {
    totalModules: number;
    startedModules: number;
    completedModules: number;
    overallPct: number;
    totalTimeEstMin: number;
    totalTimeSpentMin: number;
  };
  modules: ModuleProgress[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMin(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const TIER_COLORS: Record<string, string> = {
  l3: "from-emerald-500 to-teal-600",
  l4: "from-sky-500 to-blue-600",
  l5: "from-violet-500 to-purple-700",
  all: "from-slate-500 to-slate-600",
};

const TIER_LABELS: Record<string, string> = {
  l3: "Level 3", l4: "Level 4", l5: "Level 5", all: "All",
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  verified: { label: "Verified", color: "text-emerald-300", bg: "bg-emerald-500/20 border-emerald-500/40", icon: <Award className="w-3.5 h-3.5" /> },
  done: { label: "Completed", color: "text-blue-300", bg: "bg-blue-500/20 border-blue-500/40", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  studying: { label: "In Progress", color: "text-amber-300", bg: "bg-amber-500/20 border-amber-500/40", icon: <Play className="w-3.5 h-3.5" /> },
  not_started: { label: "Not Started", color: "text-slate-400", bg: "bg-slate-700/50 border-slate-600/40", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

// ─── Circular progress ring ───────────────────────────────────────────────────

function Ring({ pct, size = 80, stroke = 7, gradient, label }:
  { pct: number; size?: number; stroke?: number; gradient?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const gradId = `ring-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradient === "emerald" && (<><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#14b8a6" /></>)}
            {gradient === "blue" && (<><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#6366f1" /></>)}
            {gradient === "amber" && (<><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f97316" /></>)}
            {!gradient && (<><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6366f1" /></>)}
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${gradId})`} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-extrabold leading-none text-sm">{pct}%</span>
        {label && <span className="text-slate-500 text-[9px] leading-none mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, sub, color }:
  { icon: React.ReactNode; value: string | number; label: string; sub?: string; color: string }) {
  return (
    <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl px-4 py-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold text-white leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-none">{label}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Node row ─────────────────────────────────────────────────────────────────

function NodeRow({ node }: { node: NodeProgress }) {
  const meta = STATUS_META[node.status] ?? STATUS_META.not_started;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition group">
      {/* Status icon */}
      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
        {meta.icon}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium leading-snug truncate">{node.title}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {node.timeSpentMinutes > 0 ? fmtMin(node.timeSpentMinutes) : "—"} spent
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {fmtDate(node.lastVisit)}
          </span>
          {node.verifiedAt && (
            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
              <Award className="w-3 h-3" /> Verified {fmtDate(node.verifiedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Read bar + pct */}
      <div className="shrink-0 w-24 hidden sm:block">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-slate-500">Read</span>
          <span className="text-[10px] text-slate-300 font-medium">{node.readPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${node.readPct === 100 ? "bg-emerald-500" : "bg-violet-500"
              }`}
            style={{ width: `${node.readPct}%` }}
          />
        </div>
      </div>

      {/* XP badge */}
      <div className="shrink-0 hidden md:flex items-center gap-1 text-[10px] text-amber-400 font-medium">
        <Zap className="w-3 h-3" />{node.xpReward}
      </div>

      {/* Status chip */}
      <span className={`shrink-0 hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
        {meta.label}
      </span>
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({ module }: { module: ModuleProgress }) {
  const [open, setOpen] = useState(false);
  const tierColor = TIER_COLORS[module.tier] ?? TIER_COLORS.all;
  const ringGrad = module.tier === "l3" ? "emerald" : module.tier === "l4" ? "blue" : "amber";

  const statusBreakdown = [
    { key: "verified", count: module.verified, color: "bg-emerald-500" },
    { key: "done", count: module.completed - module.verified, color: "bg-blue-500" },
    { key: "studying", count: module.inProgress, color: "bg-amber-500" },
    { key: "not_started", count: module.notStarted, color: "bg-slate-700" },
  ];

  const hasActivity = module.avgReadPct > 0 || module.timeSpentMinutes > 0;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 overflow-hidden transition-all hover:border-slate-600/80">

      {/* ── Card header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 transition"
      >
        {/* Tier stripe */}
        <div className={`w-1.5 h-14 rounded-full bg-gradient-to-b ${tierColor} shrink-0`} />

        {/* Ring */}
        <Ring pct={module.completionPct} size={72} stroke={7} gradient={ringGrad} />

        {/* Module info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-base leading-snug truncate">{module.name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${tierColor} text-white shrink-0`}>
              {TIER_LABELS[module.tier] ?? module.tier}
            </span>
          </div>

          {/* Progress segment bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px w-full max-w-xs">
            {statusBreakdown.map(s => s.count > 0 && (
              <div key={s.key} className={`${s.color} transition-all`}
                style={{ width: `${module.total > 0 ? (s.count / module.total) * 100 : 0}%` }} />
            ))}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> {module.completed}/{module.total} nodes
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {hasActivity ? fmtMin(module.timeSpentMinutes) : "0m"} / {fmtMin(module.estimatedTimeMinutes)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Last: {fmtDate(module.lastVisit)}
            </span>
            {module.daysActive > 0 && (
              <span className="flex items-center gap-1 text-violet-400">
                <Activity className="w-3.5 h-3.5" /> {module.daysActive}d active
              </span>
            )}
          </div>
        </div>

        {/* Right: XP + quiz */}
        <div className="shrink-0 hidden lg:flex flex-col items-end gap-1.5 text-right">
          <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
            <Zap className="w-4 h-4" /> {module.xpEarned} / {module.totalXp} XP
          </div>
          {module.avgQuizScore !== null && (
            <div className="flex items-center gap-1 text-xs text-violet-400 font-medium">
              <BarChart3 className="w-3.5 h-3.5" /> Quiz avg: {module.avgQuizScore}%
            </div>
          )}
          {module.verified > 0 && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <Award className="w-3.5 h-3.5" /> {module.verified} verified
            </div>
          )}
        </div>

        {/* Chevron */}
        <div className="shrink-0 text-slate-500">
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {/* ── Expandable node list ── */}
      {open && (
        <div className="px-5 pb-4 space-y-2 border-t border-slate-800/60 pt-3">

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { label: "Time spent", value: fmtMin(module.timeSpentMinutes), icon: <Clock className="w-3.5 h-3.5" />, color: "text-sky-400" },
              { label: "Est. total", value: fmtMin(module.estimatedTimeMinutes), icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-slate-400" },
              { label: "Days active", value: `${module.daysActive}`, icon: <Flame className="w-3.5 h-3.5" />, color: "text-amber-400" },
              { label: "First opened", value: fmtDate(module.firstVisit), icon: <Calendar className="w-3.5 h-3.5" />, color: "text-violet-400" },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                <div className={`flex items-center gap-1 text-[10px] font-medium mb-0.5 ${s.color}`}>
                  {s.icon} {s.label}
                </div>
                <p className="text-white text-sm font-bold leading-none">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Node rows */}
          <div className="space-y-1.5">
            {module.nodes.map(node => <NodeRow key={node.id} node={node} />)}
          </div>

          {module.nodes.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No content nodes yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "started" | "completed" | "not_started">("all");

  useEffect(() => {
    fetch("/api/progress/modules")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-3xl px-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.modules) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Could not load progress data.
      </div>
    );
  }

  const { profile, summary, modules } = data;

  // Filter modules
  const visible = modules.filter(m => {
    if (filter === "started") return m.avgReadPct > 0 && m.completionPct < 100;
    if (filter === "completed") return m.completionPct === 100;
    if (filter === "not_started") return m.avgReadPct === 0;
    return true;
  });

  const overallTimeLabel = summary.totalTimeSpentMin > 0
    ? `${fmtMin(summary.totalTimeSpentMin)} of ${fmtMin(summary.totalTimeEstMin)}`
    : "No time tracked yet";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-6 h-6 text-violet-400" />
              <h1 className="text-2xl font-extrabold text-white">My Learning Progress</h1>
            </div>
            <p className="text-slate-400 text-sm">
              {profile.name ?? "Student"} ·{" "}
              <span className="text-violet-300 font-medium">
                {TIER_LABELS[profile.role] ?? profile.role}
              </span>
              {profile.department && (
                <> · <span className="text-sky-300 font-medium">{profile.department}</span></>
              )}
            </p>
          </div>

          {/* Overall ring */}
          <Ring pct={summary.overallPct} size={80} stroke={7} label="overall" />
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            icon={<Target className="w-5 h-5" />}
            value={`${summary.completedModules}/${summary.totalModules}`}
            label="Modules done"
            sub={`${summary.startedModules} in progress`}
            color="bg-violet-500/20 text-violet-400"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            value={summary.totalTimeSpentMin > 0 ? fmtMin(summary.totalTimeSpentMin) : "0m"}
            label="Time studied"
            sub={overallTimeLabel}
            color="bg-sky-500/20 text-sky-400"
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            value={profile.streak.currentStreak}
            label="Day streak"
            sub={`Longest: ${profile.streak.longestStreak}d`}
            color="bg-amber-500/20 text-amber-400"
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            value={profile.xp.toLocaleString()}
            label="Total XP"
            color="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            value={`${summary.overallPct}%`}
            label="Overall progress"
            color="bg-rose-500/20 text-rose-400"
          />
        </div>

        {/* ── Global progress bar ── */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Overall curriculum progress</span>
            <span className="font-medium text-white">{summary.overallPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all duration-1000"
              style={{ width: `${summary.overallPct}%` }}
            />
          </div>
          <div className="flex gap-4 text-[10px] text-slate-500 flex-wrap">
            {[
              { color: "bg-emerald-500", label: "Verified" },
              { color: "bg-blue-500", label: "Completed" },
              { color: "bg-amber-500", label: "In Progress" },
              { color: "bg-slate-700", label: "Not Started" },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {([
            ["all", "All Modules", modules.length],
            ["started", "In Progress", modules.filter(m => m.avgReadPct > 0 && m.completionPct < 100).length],
            ["completed", "Completed", modules.filter(m => m.completionPct === 100).length],
            ["not_started", "Not Started", modules.filter(m => m.avgReadPct === 0).length],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border
                ${filter === key
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"}`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold
                ${filter === key ? "bg-white/20 text-white" : "bg-slate-700 text-slate-400"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Module cards ── */}
        <div className="space-y-3">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <CheckSquare className="w-10 h-10 opacity-40" />
              <p className="text-sm">No modules in this category.</p>
            </div>
          ) : (
            visible.map(m => <ModuleCard key={m.id} module={m} />)
          )}
        </div>

        {/* ── Footer note ── */}
        <p className="text-center text-xs text-slate-600 pb-4">
          Showing {visible.length} of {modules.length} modules ·{" "}
          Filtered to your level ({TIER_LABELS[profile.role] ?? profile.role})
          {profile.department ? ` and department (${profile.department})` : ""}.
          Time spent is estimated from reading progress.
        </p>
      </div>
    </div>
  );
}
