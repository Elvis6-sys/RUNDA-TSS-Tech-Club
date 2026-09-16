"use client";

/**
 * ProgressRing — animated SVG ring for micro-progress indicators.
 *
 * Variants:
 *   "ring"   — full circular ring (default) — used on module cards, node cards
 *   "arc"    — 270° arc opening at the bottom — used in sidebars
 *   "pill"   — thin horizontal bar with label — used in list rows
 *   "badge"  — ring with status icon inside instead of pct number
 *
 * All variants animate from 0 → target on mount using a CSS transition.
 */

import { useEffect, useState } from "react";

// ─── Colour helpers ───────────────────────────────────────────────────────────

const PCT_GRADIENT: Record<string, [string, string]> = {
  default:  ["#8b5cf6", "#38bdf8"],   // violet → sky
  success:  ["#34d399", "#10b981"],   // emerald
  warning:  ["#fbbf24", "#f59e0b"],   // amber
  danger:   ["#f87171", "#ef4444"],   // red
  violet:   ["#a78bfa", "#7c3aed"],
  sky:      ["#38bdf8", "#0284c7"],
  emerald:  ["#34d399", "#059669"],
};

function gradientId(uid: string) { return `pr-${uid}`; }

function gradColors(pct: number, scheme?: string): [string, string] {
  if (scheme && PCT_GRADIENT[scheme]) return PCT_GRADIENT[scheme];
  if (pct >= 100) return PCT_GRADIENT.success;
  if (pct >= 60)  return PCT_GRADIENT.default;
  if (pct >= 30)  return PCT_GRADIENT.warning;
  return PCT_GRADIENT.danger;
}

// ─── Status icons ─────────────────────────────────────────────────────────────

export type ProgressStatus = "not_started" | "studying" | "done" | "verified";

const STATUS_ICON: Record<ProgressStatus, string> = {
  not_started: "○",
  studying:    "◎",
  done:        "◉",
  verified:    "✦",
};

const STATUS_COLOR: Record<ProgressStatus, string> = {
  not_started: "text-slate-500",
  studying:    "text-amber-400",
  done:        "text-sky-400",
  verified:    "text-emerald-400",
};

// ─── Variants ─────────────────────────────────────────────────────────────────

type RingProps = {
  pct: number;
  size?: number;           // px — default 48
  stroke?: number;         // stroke width — default 4
  scheme?: string;         // colour scheme key
  label?: string;          // overrides numeric pct label inside ring
  status?: ProgressStatus; // when set, shows status icon instead of pct
  showPct?: boolean;       // default true
  uid?: string;            // unique id for SVG gradient (avoids collision)
  className?: string;
};

export function ProgressRing({
  pct,
  size = 48,
  stroke = 4,
  scheme,
  label,
  status,
  showPct = true,
  uid = "default",
  className = "",
}: RingProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(Math.min(100, Math.max(0, pct))), 100);
    return () => clearTimeout(t);
  }, [pct]);

  const r       = (size - stroke * 2) / 2;
  const circ    = 2 * Math.PI * r;
  const offset  = circ - (circ * animated) / 100;
  const cx      = size / 2;
  const [c1, c2] = gradColors(pct, scheme);
  const gid     = gradientId(uid);

  const innerLabel = label ?? (status ? STATUS_ICON[status] : `${Math.round(pct)}%`);
  const innerColor = status ? STATUS_COLOR[status] : "text-white";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progress: ${Math.round(pct)}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-800"
        />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
      </svg>
      {showPct && (
        <span
          className={`absolute text-center font-bold leading-none ${innerColor}`}
          style={{ fontSize: size < 36 ? "9px" : size < 52 ? "11px" : "13px" }}
        >
          {innerLabel}
        </span>
      )}
    </div>
  );
}

// ─── Pill variant (horizontal bar) ───────────────────────────────────────────

type PillProps = {
  pct: number;
  label?: string;
  scheme?: string;
  height?: number;    // px — default 6
  showLabel?: boolean;
  className?: string;
};

export function ProgressPill({
  pct,
  label,
  scheme,
  height = 6,
  showLabel = true,
  className = "",
}: PillProps) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(Math.min(100, Math.max(0, pct))), 120);
    return () => clearTimeout(t);
  }, [pct]);

  const [c1, c2] = gradColors(pct, scheme);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 rounded-full bg-slate-800 overflow-hidden"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${animated}%`,
            background: `linear-gradient(90deg, ${c1}, ${c2})`,
            transition: "width 0.9s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-mono text-slate-400 shrink-0 w-7 text-right">
          {label ?? `${Math.round(pct)}%`}
        </span>
      )}
    </div>
  );
}

// ─── Stepped indicator (n dots, filled = completed) ──────────────────────────

type StepsProps = {
  total: number;
  completed: number;
  size?: number;       // dot size px
  scheme?: string;
  className?: string;
};

export function ProgressSteps({ total, completed, size = 8, scheme, className = "" }: StepsProps) {
  const [c1] = gradColors((completed / Math.max(total, 1)) * 100, scheme);
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`${completed} of ${total} completed`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-500"
          style={{
            width: size,
            height: size,
            backgroundColor: i < completed ? c1 : "#1e293b",
            border: `1px solid ${i < completed ? c1 : "#334155"}`,
            transitionDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: ProgressStatus }) {
  const cfg: Record<ProgressStatus, { bg: string; text: string; label: string }> = {
    not_started: { bg: "bg-slate-800 border-slate-700",              text: "text-slate-500", label: "Not started" },
    studying:    { bg: "bg-amber-500/10 border-amber-500/30",        text: "text-amber-400", label: "Studying"    },
    done:        { bg: "bg-sky-500/10 border-sky-500/30",            text: "text-sky-400",   label: "Done"        },
    verified:    { bg: "bg-emerald-500/10 border-emerald-500/30",    text: "text-emerald-400", label: "Verified"  },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${c.bg} ${c.text}`}>
      {STATUS_ICON[status]} {c.label}
    </span>
  );
}

// ─── Default export convenience ───────────────────────────────────────────────

export default ProgressRing;
