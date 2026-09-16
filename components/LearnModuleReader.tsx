"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen, CheckCircle2, XCircle, AlertTriangle, Info, ChevronRight,
  ArrowLeft, ArrowRight, RefreshCw, Loader2, Zap, Flame, Star,
  GraduationCap, Trophy, Lock, Copy, Check, Play, Pause,
  FileText, Code2, ClipboardList, ListChecks, File, Image, Video,
  X, ChevronLeft, Menu, Lightbulb, Ban, Eye, RotateCcw, Rocket,
  Circle, Scale, Edit3, MessageSquare, CheckSquare, Link2, BarChart3,
  Paperclip, Palette, Mic,
  PartyPopper, Shield, WifiOff, Bell,
  Target, Zap as ZapIcon, FlaskConical, Wrench, Sparkles, Sun,
  Download,
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import QuizGradeNotifications from "@/components/QuizGradeNotifications";
import QuizResponseTracker from "@/components/QuizResponseTracker";
import StudentQuizResults from "@/components/StudentQuizResults";
import StudentModuleSidebar from "@/components/StudentModuleSidebar";
import StudentModuleSidebarTOC from "@/components/StudentModuleSidebarTOC";
import SecureExamDetector from "@/components/SecureExamDetector";
import AdminExitDialog from "@/components/AdminExitDialog";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useModuleReading } from "@/contexts/ModuleReadingContext";
import {
  type LearnModule, type LearnBlock, type TextBlock, type QuizBlock,
  type ChecklistBlock, type CodeBlock, type LearnTopic,
  type IndicativeContent, type LearningOutcome, countAllBlocks,
} from "@/lib/learnContent";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  moduleSlug: string;
  module?: LearnModule; // Optional - for static modules
  trackId?: string; // Optional - for database modules
  trackName?: string;
  toc?: any[]; // Table of contents from database
  customTocEntries?: any[]; // Custom TOC entries
  nodes?: any[]; // SkillNodes with content blocks
  initialProgress?: { readPct: number; status: string } | null;
  userName: string;
  userId?: string;
};

// ─── Tier colours by module tier ──────────────────────────────────────────────

const TIER_GRAD: Record<string, string> = {
  l3: "from-emerald-500 to-teal-500",
  l4: "from-sky-500 to-blue-600",
  l5: "from-violet-500 to-purple-600",
};
const TIER_ACCENT: Record<string, string> = {
  l3: "text-emerald-400", l4: "text-sky-400", l5: "text-violet-400",
};
const TIER_BORDER: Record<string, string> = {
  l3: "border-emerald-500/30", l4: "border-sky-500/30", l5: "border-violet-500/30",
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMd(md: string): string {
  return md
    .replace(/^###### (.+)$/gm, '<h6 class="text-sm font-bold text-slate-300 mt-3 mb-1">$1</h6>')
    .replace(/^##### (.+)$/gm, '<h5 class="text-sm font-bold text-slate-200 mt-3 mb-1">$1</h5>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold text-white mt-4 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-white mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-extrabold text-sky-300 mt-8 mb-4 pb-2 border-b border-slate-700/60">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-extrabold text-white mt-8 mb-4">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="text-white font-bold italic">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-slate-200">$1</em>')
    .replace(/~~(.+?)~~/g, '<del class="line-through text-slate-500">$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-sky-400 underline hover:text-sky-300">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-xl my-4 border border-slate-700" />')
    .replace(/`([^`\n]+)`/g, '<code class="rounded-md bg-slate-800 px-1.5 py-0.5 text-sky-300 text-[13px] font-mono">$1</code>')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_m: string, code: string) =>
      `<pre class="rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 font-mono text-sm text-emerald-300 overflow-x-auto my-4 leading-relaxed whitespace-pre shadow-inner">${code.trim()}</pre>`)
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_m: string, header: string, rows: string) => {
      const th = header.split("|").filter(Boolean).map((c: string) =>
        `<th class="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80">${c.trim()}</th>`).join("");
      const tr = rows.trim().split("\n").map((row: string) =>
        `<tr class="border-t border-slate-800/60 hover:bg-slate-800/30 transition">${row.split("|").filter(Boolean).map((c: string) =>
          `<td class="px-4 py-2.5 text-sm text-slate-300">${c.trim()}</td>`).join("")}</tr>`).join("");
      return `<div class="overflow-x-auto my-5 rounded-2xl border border-slate-700 overflow-hidden"><table class="w-full text-left"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
    })
    .replace(/^---$/gm, '<hr class="my-6 border-slate-700" />')
    .replace(/^:::info\n([\s\S]*?):::/gm, (_m: string, c: string) =>
      `<div class="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 my-4 text-sm text-sky-200">💡 ${c.trim()}</div>`)
    .replace(/^:::warning\n([\s\S]*?):::/gm, (_m: string, c: string) =>
      `<div class="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 my-4 text-sm text-amber-200">⚠️ ${c.trim()}</div>`)
    .replace(/^:::tip\n([\s\S]*?):::/gm, (_m: string, c: string) =>
      `<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 my-4 text-sm text-emerald-200">✅ ${c.trim()}</div>`)
    .replace(/^:::error\n([\s\S]*?):::/gm, (_m: string, c: string) =>
      `<div class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 my-4 text-sm text-rose-200">🚫 ${c.trim()}</div>`)
    .replace(/^- \[ \] (.+)$/gm, '<label class="flex items-center gap-2 my-1 text-sm text-slate-300"><input type="checkbox" disabled class="rounded" /> $1</label>')
    .replace(/^- \[x\] (.+)$/gm, '<label class="flex items-center gap-2 my-1 text-sm text-slate-300 line-through text-slate-500"><input type="checkbox" checked disabled class="rounded" /> $1</label>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 text-slate-300 text-sm list-decimal mb-1">$2</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 text-slate-300 text-sm list-disc mb-1">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-sky-500 pl-4 my-3 text-slate-400 italic text-sm bg-sky-500/5 py-2 rounded-r-xl">$1</blockquote>')
    .replace(/\n/g, "<br />");
}

// ─── Progress ring (inline SVG, no extra deps) ────────────────────────────────

function ProgressRing({ pct, size = 48, tier = "l4" }: { pct: number; size?: number; tier?: string }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(pct), 150); return () => clearTimeout(t); }, [pct]);
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const colors: Record<string, [string, string]> = {
    l3: ["#34d399", "#10b981"], l4: ["#38bdf8", "#6366f1"], l5: ["#a78bfa", "#7c3aed"],
  };
  const [c1, c2] = colors[tier] ?? colors.l4;
  const gid = `prg-${size}-${tier}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ - (circ * animated) / 100}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.34,1.56,.64,1)" }} />
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-extrabold" style={{ color: c1 }}>{Math.round(animated)}%</span>
      </div>
    </div>
  );
}

// ─── TextBlock — Immersive Interactive Reader ────────────────────────────────

const TIER_PAGE_ACCENT: Record<string, { border: string; glow: string; ribbon: string; dot: string; grad: string }> = {
  l3: { border: "#10b981", glow: "rgba(16,185,129,0.15)", ribbon: "#065f46", dot: "#34d399", grad: "135deg, #064e3b 0%, #0f172a 100%" },
  l4: { border: "#38bdf8", glow: "rgba(56,189,248,0.15)", ribbon: "#0c4a6e", dot: "#38bdf8", grad: "135deg, #0c2340 0%, #0f172a 100%" },
  l5: { border: "#a78bfa", glow: "rgba(167,139,250,0.15)", ribbon: "#4c1d95", dot: "#a78bfa", grad: "135deg, #1e1040 0%, #0f172a 100%" },
};

// Split markdown into logical sections by h2/h3 headings
function splitIntoSections(md: string): { title: string; body: string }[] {
  const lines = md.split("\n");
  const sections: { title: string; body: string }[] = [];
  let cur: { title: string; body: string } | null = null;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2 || h3) {
      if (cur) sections.push(cur);
      cur = { title: (h2 || h3)![1].trim(), body: "" };
    } else if (cur) {
      cur.body += line + "\n";
    } else {
      cur = { title: "", body: line + "\n" };
    }
  }
  if (cur) sections.push(cur);
  // Merge short untitled intro with first titled section
  if (sections.length > 1 && sections[0].title === "" && sections[0].body.trim().length < 100) {
    sections[1].body = sections[0].body + sections[1].body;
    sections.shift();
  }
  return sections.filter(s => s.body.trim() || s.title);
}

// Mascot reactions by milestone
const MASCOT_REACTIONS = [
  { threshold: 1, icon: <Rocket className="w-6 h-6" />, msg: "You started! Keep going!" },
  { threshold: 2, icon: <Flame className="w-6 h-6" />, msg: "On fire! Great reading!" },
  { threshold: 3, icon: <Zap className="w-6 h-6" />, msg: "Streak! 3 sections done!" },
  { threshold: 5, icon: <Trophy className="w-6 h-6" />, msg: "Half way there, legend!" },
  { threshold: 99, icon: <GraduationCap className="w-6 h-6" />, msg: "You finished it! Amazing!" },
];

// XP particles
function XPBurst({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <div className="pointer-events-none fixed z-[9999]" style={{ left: x, top: y }}>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * 360;
        const dist = 30 + Math.random() * 20;
        const dx = Math.cos((angle * Math.PI) / 180) * dist;
        const dy = Math.sin((angle * Math.PI) / 180) * dist;
        return (
          <div key={i} className="absolute text-xs font-extrabold animate-ping"
            style={{
              color, left: dx, top: dy,
              animationDuration: "0.6s", animationIterationCount: 1,
              fontSize: i % 3 === 0 ? "14px" : "10px",
            }}>
            {i % 4 === 0 ? "✦" : i % 4 === 1 ? "+" : i % 4 === 2 ? "★" : "·"}
          </div>
        );
      })}
      <div className="absolute text-xs font-extrabold whitespace-nowrap"
        style={{ color, top: -20, left: -10, animation: "fadeUp 0.8s ease forwards" }}>
        +10 XP
      </div>
    </div>
  );
}

function TextBlockView({ block, onRead, tier }: { block: TextBlock; onRead: () => void; tier: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  const [visible, setVisible] = useState(false);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [xpBursts, setXpBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [mascot, setMascot] = useState<{ icon: JSX.Element; msg: string } | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalRead, setTotalRead] = useState(0);
  const [fontSize, setFontSize] = useState<14 | 16 | 18>(14);
  const [highlightedSentences, setHighlightedSentences] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const nextBurst = useRef(0);

  const accent = TIER_PAGE_ACCENT[tier] ?? TIER_PAGE_ACCENT.l4;
  const sections = splitIntoSections(block.content);
  const isSingleSection = sections.length <= 1;
  const activeSection = sections[sectionIdx] ?? sections[0];
  const progress = sections.length > 0 ? Math.round(((sectionIdx + (revealed.has(sectionIdx) ? 1 : 0)) / sections.length) * 100) : 0;
  const words = block.content.split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(words / 200));

  // Enter view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) { setVisible(true); fired.current = true; onRead(); }
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onRead]);

  function spawnXP(e: React.MouseEvent) {
    const id = nextBurst.current++;
    setXpBursts(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setXpBursts(prev => prev.filter(b => b.id !== id)), 900);
  }

  function revealSection(idx: number, e?: React.MouseEvent) {
    if (revealed.has(idx)) return;
    const newRevealed = new Set(revealed).add(idx);
    setRevealed(newRevealed);
    const newTotal = totalRead + 1;
    setTotalRead(newTotal);
    const newStreak = streak + 1;
    setStreak(newStreak);
    if (e) spawnXP(e);

    // Show mascot reaction
    const reaction = [...MASCOT_REACTIONS].reverse().find(r => newStreak >= r.threshold);
    if (reaction) {
      setMascot(reaction);
      setTimeout(() => setMascot(null), 2200);
    }

    // Completion
    if (newRevealed.size >= sections.length) {
      setCompleted(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }

  function goToSection(idx: number, e?: React.MouseEvent) {
    setSectionIdx(idx);
    if (!revealed.has(idx) && idx > 0 && revealed.has(idx - 1)) {
      // Advance unlocks
    }
  }

  // Toggle sentence highlight on click
  function handleContentClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const text = target.textContent?.trim();
    if (!text || text.length < 10 || target.tagName === "DIV") return;
    const key = text.slice(0, 60);
    setHighlightedSentences(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const sectionHtml = renderMd(
    activeSection ? (activeSection.title ? `## ${activeSection.title}\n${activeSection.body}` : activeSection.body) : ""
  );

  return (
    <>
      {/* CSS for confetti + XP float animation */}
      <style>{`
        @keyframes fadeUp { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(-40px); } }
        @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(200px) rotate(720deg);opacity:0} }
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .reader-highlight { background: rgba(250,204,21,0.25) !important; border-radius: 3px; cursor: pointer; transition: background 0.2s; }
        .reader-highlight:hover { background: rgba(250,204,21,0.4) !important; }
      `}</style>

      {/* XP burst particles */}
      {xpBursts.map(b => <XPBurst key={b.id} x={b.x} y={b.y} color={accent.dot} />)}

      {/* Mascot popup */}
      {mascot && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", border: `1px solid ${accent.border}44`, animation: "popIn 0.4s ease" }}>
          <div className="text-3xl">{mascot.icon}</div>
          <div>
            <p className="text-xs font-extrabold text-white">{mascot.msg}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {[...Array(Math.min(streak, 5))].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
            </div>
          </div>
        </div>
      )}

      {/* Confetti burst on completion */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const colors = [accent.dot, "#fbbf24", "#f472b6", "#34d399", "#60a5fa"];
            const left = Math.random() * 100;
            const delay = Math.random() * 1.2;
            const dur = 1.5 + Math.random();
            const color = colors[i % colors.length];
            return (
              <div key={i} className="absolute top-0 text-lg"
                style={{ left: `${left}%`, color, animationName: "confettiFall", animationDuration: `${dur}s`, animationDelay: `${delay}s`, animationFillMode: "forwards" }}>
                {["✦", "●", "▲", "★", "■"][i % 5]}
              </div>
            );
          })}
        </div>
      )}

      {/* Main card */}
      <div ref={ref} className={`my-5 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: `linear-gradient(${accent.grad})`, border: `1px solid ${accent.border}33`, boxShadow: `0 0 40px ${accent.glow}, 0 2px 0 ${accent.border}22 inset` }}>

          {/* ── Top strip: header bar ── */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: `${accent.border}20`, background: `linear-gradient(90deg,${accent.glow},transparent)` }}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 animate-bounce" style={{ color: accent.dot }} />
              <span className="text-[11px] font-extrabold tracking-widest uppercase" style={{ color: accent.dot }}>
                Reading
              </span>
              <span className="text-[10px] text-slate-500">·</span>
              <span className="text-[10px] text-slate-500">{readMins} min · {words} words</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Streak flame */}
              {streak > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: `${accent.border}22`, color: accent.dot }}>
                  <Flame className="w-3.5 h-3.5" /> {streak} streak
                </div>
              )}
              {/* Font size */}
              <div className="flex gap-0.5">
                {([14, 16, 18] as const).map(sz => (
                  <button key={sz} onClick={() => setFontSize(sz)}
                    className="w-7 h-6 rounded text-[10px] font-bold transition-all"
                    style={fontSize === sz ? { background: `${accent.border}33`, color: accent.dot } : { color: "#475569" }}>
                    {sz === 14 ? "A" : sz === 16 ? "A" : "A"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Section tabs (only if multiple sections) ── */}
          {!isSingleSection && (
            <div className="flex gap-1 px-4 pt-3 pb-1 overflow-x-auto no-scrollbar">
              {sections.map((s, i) => {
                const isRead = revealed.has(i);
                const isCurrent = sectionIdx === i;
                const isLocked = i > 0 && !revealed.has(i - 1) && !isRead;
                return (
                  <button key={i} disabled={isLocked}
                    onClick={e => goToSection(i, e)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                    style={isCurrent
                      ? { background: accent.border, color: "#fff", boxShadow: `0 0 12px ${accent.border}88` }
                      : isRead
                        ? { background: `${accent.border}22`, color: accent.dot }
                        : isLocked
                          ? { background: "#1e293b", color: "#334155", cursor: "not-allowed" }
                          : { background: "#1e293b", color: "#64748b", cursor: "pointer" }}>
                    {isRead ? <Check className="w-3 h-3" /> : isLocked ? <Lock className="w-3 h-3" /> : `${i + 1}`}
                    <span className="max-w-[80px] truncate">{s.title || `Part ${i + 1}`}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Content pane ── */}
          <div className="px-5 pt-4 pb-2 relative min-h-[120px]">
            {/* Left accent bar */}
            <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
              style={{ background: `linear-gradient(180deg,${accent.border}00,${accent.border}88,${accent.border}00)` }} />

            {/* Section title pill */}
            {activeSection?.title && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-[11px] font-extrabold"
                style={{ background: `${accent.border}18`, color: accent.dot, border: `1px solid ${accent.border}30` }}>
                <span>§</span>{activeSection.title}
              </div>
            )}

            {/* Main content — click sentences to highlight */}
            <div
              onClick={handleContentClick}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.85, cursor: "text", animation: "slideUp 0.4s ease" }}
              className="prose prose-invert max-w-none text-slate-300 select-text
                [&_h1]:text-white [&_h1]:font-extrabold [&_h1]:text-xl [&_h1]:mt-5 [&_h1]:mb-3
                [&_h2]:text-sky-300 [&_h2]:font-extrabold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:pb-1.5 [&_h2]:border-b [&_h2]:border-sky-500/20
                [&_h3]:text-slate-200 [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2
                [&_strong]:text-white [&_strong]:font-bold
                [&_em]:italic [&_em]:text-slate-300
                [&_a]:text-sky-400 [&_a]:underline [&_a]:decoration-sky-500/40
                [&_blockquote]:border-l-[3px] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400 [&_blockquote]:rounded-r-lg [&_blockquote]:bg-sky-500/5 [&_blockquote]:py-2 [&_blockquote]:my-3
                [&_code]:bg-slate-800/80 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sky-300 [&_code]:text-[0.85em] [&_code]:font-mono
                [&_pre]:bg-slate-900 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-3 [&_pre]:text-emerald-300
                [&_li]:mb-1.5 [&_li]:text-slate-300
                [&_ul]:my-2 [&_ol]:my-2
                [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-3 [&_img]:border [&_img]:border-slate-700/60
                [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:my-3
                [&_th]:bg-slate-800/80 [&_th]:text-slate-300 [&_th]:font-bold [&_th]:text-xs [&_th]:py-2.5 [&_th]:px-4
                [&_td]:text-slate-300 [&_td]:text-sm [&_td]:py-2 [&_td]:px-4 [&_td]:border-t [&_td]:border-slate-800/60
                [&_hr]:border-slate-700/50 [&_hr]:my-4"
              dangerouslySetInnerHTML={{ __html: sectionHtml }}
            />

            {/* Highlight hint (first visit) */}
            {!isSingleSection && !revealed.has(sectionIdx) && sectionIdx === 0 && (
              <p className="text-[10px] text-slate-600 mt-3 italic"><Lightbulb className="w-3 h-3 inline mr-1 text-slate-600" />Tip: Click any sentence to highlight it</p>
            )}
          </div>

          {/* ── Section action bar ── */}
          <div className="px-5 pb-4 pt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Back button */}
              {!isSingleSection && sectionIdx > 0 && (
                <button onClick={() => setSectionIdx(s => s - 1)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:text-white transition"
                  style={{ background: "#1e293b", border: "1px solid #334155" }}>
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              )}
              {/* Section counter */}
              {!isSingleSection && (
                <span className="text-[10px] text-slate-600">
                  {sectionIdx + 1} / {sections.length}
                </span>
              )}
            </div>

            {/* Primary CTA */}
            {!revealed.has(sectionIdx) ? (
              <button
                onClick={e => {
                  revealSection(sectionIdx, e);
                  if (!isSingleSection && sectionIdx < sections.length - 1) {
                    setTimeout(() => setSectionIdx(s => s + 1), 300);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-extrabold transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${accent.border}, ${accent.dot})`,
                  color: "#fff",
                  boxShadow: `0 4px 20px ${accent.border}55`,
                }}>
                {isSingleSection ? <><Check className="w-4 h-4" /> Mark as read</> : sectionIdx < sections.length - 1 ? <>Got it! <ArrowRight className="w-4 h-4" /></> : <><Check className="w-4 h-4" /> Complete!</>}
                <span className="text-[10px] opacity-70">+10 XP</span>
              </button>
            ) : (
              <div>
                {!isSingleSection && sectionIdx < sections.length - 1 ? (
                  <button onClick={() => setSectionIdx(s => s + 1)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
                    style={{ background: `${accent.border}22`, color: accent.dot, border: `1px solid ${accent.border}44` }}>
                    <>Next section <ArrowRight className="w-4 h-4" /></>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-extrabold" style={{ color: accent.dot }}>
                    <CheckCircle2 className="w-4 h-4" /> Completed!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Progress bar ── */}
          <div className="h-1.5 w-full" style={{ background: "#0f172a" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent.border}, ${accent.dot})`, boxShadow: `0 0 8px ${accent.dot}88` }} />
          </div>
        </div>

        {/* Completion badge — shown below card */}
        {completed && (
          <div className="mt-3 flex items-center justify-center gap-3 px-5 py-3 rounded-2xl"
            style={{ background: `${accent.border}18`, border: `1px solid ${accent.border}33`, animation: "popIn 0.5s ease" }}>
            <span className="text-2xl"><PartyPopper className="w-7 h-7 text-emerald-400" /></span>
            <div>
              <p className="font-extrabold text-white text-sm">Section mastered!</p>
              <p className="text-[11px]" style={{ color: accent.dot }}>You read {sections.length} part{sections.length !== 1 ? "s" : ""} · {words} words · +{sections.length * 10} XP earned</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── CodeBlock — line-by-line reveal ─────────────────────────────────────────

function CodeBlockView({ block, onView }: { block: CodeBlock; onView: () => void }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired.current) {
        fired.current = true; onView();
        setTimeout(() => setRevealed(true), 200);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onView]);

  function copy() {
    navigator.clipboard.writeText(block.code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div ref={ref} className={`rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden my-4 shadow-lg transition-all duration-500 ${revealed ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-800/80 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500/60" /><span className="w-3 h-3 rounded-full bg-amber-500/60" /><span className="w-3 h-3 rounded-full bg-emerald-500/60" /></div>
          <span className="text-xs font-mono text-slate-400">{block.language}</span>
          {block.caption && <span className="text-xs text-slate-500 hidden sm:inline">· {block.caption}</span>}
        </div>
        <button onClick={copy} className="text-xs text-slate-400 hover:text-white transition px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 font-mono">
          {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="px-5 py-4 font-mono text-sm text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre">{block.code}</pre>
    </div>
  );
}

// ─── QuizBlock — animated reveal + XP flash ──────────────────────────────────

// ─── QuizBlock — multi-question support with response tracking ────────────────

function QuizBlockView({
  block, done, onAnswer, tier, nodeId, blockId, userName, trackId,
}: {
  block: QuizBlock; done: boolean; onAnswer: (correct: boolean) => void;
  tier: string; nodeId?: string; blockId?: string; userName?: string; trackId?: string;
}) {
  const questions = block.questions ?? [];
  const containerRef = useRef<HTMLDivElement>(null);
  const [qIdx, setQIdx] = useState(0);
  const [quizStarted, setQuizStarted] = useState(done);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [inputs, setInputs] = useState<string[]>([]);       // fillin blanks
  const [text, setText] = useState("");                      // short / essay / coding
  const [multiSel, setMultiSel] = useState<number[]>([]);   // multiselect chosen indices
  const [matchPairs, setMatchPairs] = useState<Record<string, string>>({}); // matching answers
  const [orderedItems, setOrderedItems] = useState<number[]>([]); // ordering answer
  const [revealed, setRevealed] = useState(done);

  // ── Check for existing submission (prevent re-attempt) ───────────────────
  const [prevSubmission, setPrevSubmission] = useState<{
    id: string; status: string; totalQuestions: number;
    gradedCount: number; avgScore: number | null;
    marksReleased: boolean; createdAt: string;
  } | null>(null);
  const [checkingPrev, setCheckingPrev] = useState(!!nodeId && !!blockId);

  useEffect(() => {
    if (!nodeId || !blockId) { setCheckingPrev(false); return; }
    fetch(`/api/quiz/submissions?nodeId=${nodeId}&blockId=${blockId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const subs = data?.submissions ?? [];
        if (subs.length > 0) setPrevSubmission(subs[0]);
      })
      .catch(() => { })
      .finally(() => setCheckingPrev(false));
  }, [nodeId, blockId]);
  // ── Timer state ──────────────────────────────────────────────────────────
  // timeLeft: seconds remaining for current question (null = no limit)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  // set of question indices that timed out — never allow revisit
  const [timedOut, setTimedOut] = useState<Set<number>>(new Set());
  // ref so the timeout handler always sees fresh qIdx without stale closure
  const qIdxRef = useRef(qIdx);
  qIdxRef.current = qIdx;
  const timedOutRef = useRef(timedOut);
  timedOutRef.current = timedOut;

  // Stable ref to current question — avoids stale closure in submit/saveAndMove
  const currentQ = questions[qIdx] ?? null;
  const qt = currentQ?.questionType ?? "mcq";
  const tierBorder = TIER_BORDER[tier] ?? "border-slate-700";
  const tierGrad = TIER_GRAD[tier] ?? TIER_GRAD.l4;
  const blankCount = (currentQ?.question.match(/___/g) ?? []).length;

  // ── Anti-cheat (must be declared before timer effects that reference it) ──
  const { state: cheat, activate: activateCheat, deactivate: deactivateCheat, dismissWarning, openFilePicker, restoreFullscreen } = useAntiCheat({
    containerRef,
    submissionId,
    studentName: userName ?? "Student",
    nodeTitle: block.title ?? "Quiz",
    trackId: trackId ?? "",
    onAutoSubmit: () => {
      if (nodeId && blockId) {
        fetch("/api/quiz/response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId,
            blockId,
            trackId: trackId ?? "", // CRITICAL: trackId needed for submission creation
            questionIdx: qIdx,
            questionType: qt,
            answerText: "[AUTO-SUBMITTED]",
            totalQuestions: questions.length
          }),
        }).catch(() => { });
      }
      onAnswer(false);
    },
  });

  // saveAndMove function (must be after cheat declaration)
  async function saveAndMove(correct: boolean) {
    if (nodeId && blockId) {
      try {
        const res = await fetch("/api/quiz/response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId, blockId, trackId: trackId ?? "", questionIdx: qIdx, questionType: qt,
            answerChoice: ["mcq", "truefalse"].includes(qt) ? (chosen ?? undefined) : undefined,
            answerText: qt === "fillin" ? JSON.stringify(inputs)
              : qt === "multiselect" ? JSON.stringify(multiSel)
                : qt === "matching" ? JSON.stringify(matchPairs)
                  : qt === "ordering" ? JSON.stringify(orderedItems)
                    : ["short", "essay", "coding"].includes(qt) ? text
                      : undefined,
            totalQuestions: questions.length,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.submissionId && !submissionId) setSubmissionId(data.submissionId);
      } catch { /* non-fatal */ }
    }
    setRevealed(true);
    if (qIdx < questions.length - 1) {
      setTimeout(() => { setQIdx(i => i + 1); setChosen(null); setInputs([]); setText(""); setMultiSel([]); setMatchPairs({}); setOrderedItems([]); setRevealed(false); }, 800);
    } else {
      setTimeout(() => { deactivateCheat(); onAnswer(correct); }, 800);
    }
  }

  function submit() {
    if (!currentQ) return;
    let correct = false;
    if (["mcq", "truefalse"].includes(qt)) correct = chosen === (currentQ.correct ?? 0);
    else if (qt === "fillin") correct = (currentQ.blanks ?? []).every((a, i) => (inputs[i] ?? "").trim().toLowerCase() === a.trim().toLowerCase());
    else if (qt === "multiselect") {
      const correctSet = new Set<number>(Array.isArray(currentQ.correct) ? currentQ.correct : []);
      const studentSet = new Set<number>(multiSel);
      correct = correctSet.size === studentSet.size && [...correctSet].every(v => studentSet.has(v));
    } else if (qt === "matching" && currentQ.correctPairs) {
      correct = Object.entries(currentQ.correctPairs).every(([k, v]) => matchPairs[k] === v);
    } else if (qt === "ordering" && currentQ.correctOrder) {
      correct = currentQ.correctOrder.every((v, i) => orderedItems[i] === v);
    } else correct = true; // subjective — always "accepted", teacher grades later
    saveAndMove(correct);
  }


  // ── Countdown timer ─ resets each time qIdx or question changes ──────────
  useEffect(() => {
    const limit = currentQ?.timeLimit;
    if (!quizStarted || revealed || !limit || limit <= 0) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(limit);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        // CRITICAL FIX: Pause timer if warning is displayed or quiz was auto-submitted
        // This prevents sequential auto-submissions when student is being warned
        if (cheat.warning !== null || cheat.autoSubmitted) {
          return prev; // Keep current time, don't decrement
        }
        if (prev <= 1) {
          clearInterval(interval);
          const idx = qIdxRef.current;
          setTimedOut(s => new Set(s).add(idx));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("quiz:timeout", { detail: { idx } }));
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, quizStarted, revealed, cheat.warning, cheat.autoSubmitted]);

  // Listen for timer‑timeout custom event ───────────────────────────────────
  useEffect(() => {
    const onTimeout = (e: Event) => {
      const { idx } = (e as CustomEvent<{ idx: number }>).detail;
      if (idx !== qIdxRef.current) return;
      // CRITICAL FIX: Don't auto-submit if quiz was already auto-submitted by anti-cheat
      // or if student has been caught cheating (autoSubmitted flag)
      if (cheat.autoSubmitted) return;
      if (!revealed) saveAndMove(false);
    };
    window.addEventListener("quiz:timeout", onTimeout);
    return () => window.removeEventListener("quiz:timeout", onTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, revealed, cheat.autoSubmitted]);

  // ── Electron secure exam mode: activate when quiz starts ─────────────────
  // MUST be here — before any early returns — to satisfy React's rules of hooks.
  useEffect(() => {
    if (!quizStarted || done) return;
    if (typeof window === 'undefined' || !window.isElectron || !window.electronAPI) return;

    console.log('🔒 Quiz started — activating Electron secure exam mode');
    window.electronAPI.examModeEnter({
      assessmentType: 'quiz',
      assessmentTitle: block.title ?? 'Quiz Assessment',
      nodeId,
      trackId,
      timestamp: new Date().toISOString(),
    }).then(() => {
      console.log('✅ Electron secure mode active');
    }).catch((err: any) => {
      console.error('❌ Failed to activate Electron secure mode:', err);
    });

    return () => {
      if (typeof window !== 'undefined' && window.isElectron && window.electronAPI) {
        window.electronAPI.examModeExit().catch(() => { });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, done]);

  // ── No questions guard ──────────────────────────────────────────────────
  if (!currentQ) return <div className="text-slate-400 text-sm p-4">No questions in this block.</div>;

  // ── Already attempted — block re-attempt ────────────────────────────────
  if (checkingPrev) {
    return (
      <div className={`rounded-2xl border bg-slate-900/60 p-6 my-4 ${tierBorder}`}>
        <p className="text-xs text-slate-500 animate-pulse">Checking quiz status…</p>
      </div>
    );
  }

  // ── Show loading while checking for previous submission ──────────────────
  if (checkingPrev) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 my-4 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-600 border-t-sky-500 rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-400">Checking quiz status...</p>
      </div>
    );
  }

  if (prevSubmission) {
    // Student has already attempted this quiz - prevent re-attempt regardless of 'done' status
    const statusColor = prevSubmission.avgScore !== null
      ? prevSubmission.avgScore >= 80 ? "text-emerald-400" : prevSubmission.avgScore >= 60 ? "text-sky-400" : prevSubmission.avgScore >= 40 ? "text-amber-400" : "text-rose-400"
      : "text-amber-400";
    return (
      <div className={`rounded-2xl border bg-slate-900/60 p-6 space-y-4 my-4 shadow-lg ${tierBorder}`}>
        <div className="flex items-start gap-4">
          <ClipboardList className="w-10 h-10 text-slate-400 shrink-0" />
          <div className="flex-1">
            <p className="font-extrabold text-white text-base">{block.title ?? "Quiz Assessment"}</p>
            <p className="text-sm text-slate-400 mt-1">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Already attempted banner */}
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-sky-400 shrink-0" />
            <div>
              <p className="font-bold text-sky-200 text-sm">Quiz Already Attempted</p>
              <p className="text-xs text-slate-400 mt-0.5">
                You submitted this quiz on {new Date(prevSubmission.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
                Each quiz can only be attempted once.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl bg-slate-800/60 px-3 py-2 text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Questions</p>
              <p className="text-sm font-extrabold text-white mt-1">{prevSubmission.totalQuestions}</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 px-3 py-2 text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Graded</p>
              <p className="text-sm font-extrabold text-white mt-1">{prevSubmission.gradedCount}/{prevSubmission.totalQuestions}</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 px-3 py-2 text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Score</p>
              {prevSubmission.marksReleased && prevSubmission.avgScore !== null ? (
                <p className={`text-sm font-extrabold mt-1 ${statusColor}`}>{prevSubmission.avgScore}%</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1.5">
                  {prevSubmission.gradedCount < prevSubmission.totalQuestions
                    ? "⏳ Being graded"
                    : prevSubmission.avgScore !== null
                      ? "⏳ Pending release"
                      : "⏳ Pending"}
                </p>
              )}
            </div>
          </div>
          {prevSubmission.marksReleased && prevSubmission.avgScore !== null && (
            <div className={`text-center pt-1`}>
              <a href="/passport/my-results"
                className={`inline-flex items-center gap-2 text-sm font-bold ${statusColor} hover:underline`}>
                View full results & feedback →
              </a>
            </div>
          )}
          {!prevSubmission.marksReleased && (
            <p className="text-xs text-slate-500 text-center">
              Your results will appear in My Results once your teacher releases the marks.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Auto-submitted state ────────────────────────────────────────────────
  if (cheat.autoSubmitted) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 my-4 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="font-extrabold text-rose-300 text-lg">Quiz Auto-Submitted</p>
        <p className="text-sm text-slate-400 max-w-xs mx-auto">
          Your quiz was auto-submitted due to repeated policy violations.
          Your teacher has received a full integrity report.
        </p>
      </div>
    );
  }

  // ── Pre-start screen ────────────────────────────────────────────────────
  if (!quizStarted && !done) {
    return (
      <div className={`rounded-2xl border bg-slate-900/60 p-6 space-y-4 my-4 shadow-lg ${tierBorder}`}>
        {nodeId && blockId && <QuizResponseTracker nodeId={nodeId} blockId={blockId} tier={tier} />}
        {/* Hidden div — this is what we fullscreen */}
        <div ref={containerRef} />
        <div className="flex items-start gap-4">
          <ClipboardList className="w-10 h-10 text-slate-400 shrink-0" />
          <div>
            <p className="font-extrabold text-white text-base">{block.title ?? "Quiz Assessment"}</p>
            <p className="text-sm text-slate-400 mt-1">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-500/50 bg-red-500/20 p-4 space-y-2 text-xs text-slate-200">
          <p className="flex items-center gap-1.5 font-bold text-red-300 text-sm"><AlertTriangle className="w-5 h-5 shrink-0" /> 🚨 STRICT Exam Rules — READ CAREFULLY</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li className="font-semibold text-red-200">You will enter FULLSCREEN MODE — Do NOT exit!</li>
            <li className="font-semibold text-red-200">⚠️ ONE VIOLATION = INSTANT AUTO-SUBMIT (Quiz fails immediately)</li>
            <li>Pressing Esc, switching tabs, or leaving fullscreen = INSTANT FAIL</li>
            <li>All violations are logged and sent to your teacher in real-time</li>
            <li>Right-click, copy, paste, print, and DevTools are blocked</li>
            <li className="font-bold text-red-100 mt-2">⚠️ Stay in fullscreen for the entire quiz — no exceptions!</li>
          </ul>
        </div>
        <button onClick={() => { setQuizStarted(true); activateCheat(); }}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${tierGrad} px-6 py-3 font-bold text-white text-sm shadow hover:shadow-lg hover:scale-105 transition`}>
          <Lock className="w-4 h-4" /> Start Secure Quiz
        </button>
      </div>
    );
  }

  // ── Active quiz: question UI ─────────────────────────────────────────────
  const questionTypeLabel: Record<string, JSX.Element> = {
    mcq: <><Circle className="w-4 h-4 inline" /> Multiple Choice</>,
    truefalse: <><Scale className="w-4 h-4 inline" /> True / False</>,
    fillin: <><Edit3 className="w-4 h-4 inline" /> Fill in the Blank</>,
    short: <><MessageSquare className="w-4 h-4 inline" /> Short Answer</>,
    essay: <><FileText className="w-4 h-4 inline" /> Essay</>,
    multiselect: <><CheckSquare className="w-4 h-4 inline" /> Multi-select</>,
    matching: <><Link2 className="w-4 h-4 inline" /> Matching</>,
    ordering: <><BarChart3 className="w-4 h-4 inline" /> Ordering</>,
    coding: <><Code2 className="w-4 h-4 inline" /> Code Submission</>,
    file_upload: <><Paperclip className="w-4 h-4 inline" /> File Upload</>,
    drawing: <><Palette className="w-4 h-4 inline" /> Drawing / Diagram</>,
    audio: <><Mic className="w-4 h-4 inline" /> Audio Response</>,
    video: <><Video className="w-4 h-4 inline" /> Video Response</>,
  };

  // initialise orderedItems when the question renders for the first time
  const shuffledItems = (() => {
    if (qt !== "ordering" || !currentQ?.items?.length) return [];
    if (orderedItems.length === currentQ.items.length) return orderedItems;
    // shuffle indices once on first render
    const idxs = currentQ.items.map((_, i) => i);
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    // Store them so they stay stable across re-renders
    if (orderedItems.length === 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setTimeout(() => setOrderedItems(idxs), 0);
    }
    return idxs;
  })();

  const displayOrder = orderedItems.length > 0 ? orderedItems : shuffledItems;

  const questionUI = (
    <div className="space-y-5">
      {/* Question stem */}
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${TIER_ACCENT[tier]}`}>
          {questionTypeLabel[qt] ?? "Question"}
        </p>
        {qt === "fillin" ? (
          <p className="font-bold text-white leading-relaxed">
            {currentQ.question.split("___").map((part, i, arr) => (
              <span key={i}>{part}
                {i < arr.length - 1 && (
                  <span className="inline-block border-b-2 border-sky-400 px-3 mx-1 min-w-[70px] text-sky-200 text-center">
                    {revealed ? (currentQ.blanks?.[i] ?? "___") : (inputs[i] || "___")}
                  </span>
                )}
              </span>
            ))}
          </p>
        ) : (
          <p className="font-bold text-white text-base leading-relaxed">{currentQ.question}</p>
        )}
      </div>

      {/* ── MCQ ── */}
      {qt === "mcq" && (
        <div className="space-y-2">
          {(currentQ.options ?? []).length === 0 ? (
            <p className="text-xs text-amber-400 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-400" />This question has no options configured. Contact your trainer.
            </p>
          ) : (currentQ.options ?? []).map((opt, i) => {
            const isCorrect = i === (currentQ.correct ?? 0);
            const isChosen = i === chosen;
            let cls = "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-sky-400/60 hover:bg-slate-700/60";
            if (revealed) cls = isCorrect ? "border-emerald-500 bg-emerald-500/15 text-emerald-200 font-semibold"
              : isChosen ? "border-rose-500 bg-rose-500/15 text-rose-300" : "border-slate-800 bg-slate-900/30 text-slate-600";
            else if (isChosen) cls = "border-sky-400 bg-sky-500/15 text-sky-200";
            return (
              <button key={i} disabled={revealed} onClick={() => setChosen(i)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}>
                <span className="inline-flex w-6 h-6 rounded-full border border-current mr-3 items-center justify-center text-[11px] font-bold shrink-0 float-left mt-0.5">
                  {revealed && isCorrect ? <Check className="w-3 h-3 inline" /> : revealed && isChosen ? <X className="w-3 h-3 inline" /> : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
          {revealed && currentQ.explanation && (
            <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3 text-xs text-sky-300"><Lightbulb className="w-3.5 h-3.5 inline mr-1.5 text-sky-400" />{currentQ.explanation}</div>
          )}
        </div>
      )}

      {/* ── Multi-select ── */}
      {qt === "multiselect" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Select <span className="font-bold text-white">all</span> that apply</p>
          {(currentQ.options ?? []).length === 0 ? (
            <p className="text-xs text-amber-400 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-400" />This question has no options configured. Contact your trainer.
            </p>
          ) : (currentQ.options ?? []).map((opt, i) => {
            const correctArr: number[] = Array.isArray(currentQ.correct) ? currentQ.correct : [];
            const isCorrect = correctArr.includes(i);
            const isChosen = multiSel.includes(i);
            let cls = "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-sky-400/60";
            if (revealed) cls = isCorrect && isChosen ? "border-emerald-500 bg-emerald-500/15 text-emerald-200 font-semibold"
              : isCorrect && !isChosen ? "border-amber-500 bg-amber-500/10 text-amber-300"
                : !isCorrect && isChosen ? "border-rose-500 bg-rose-500/15 text-rose-300" : "border-slate-800 bg-slate-900/30 text-slate-600";
            else if (isChosen) cls = "border-sky-400 bg-sky-500/15 text-sky-200";
            return (
              <button key={i} disabled={revealed}
                onClick={() => setMultiSel(prev => prev.includes(i) ? prev.filter(v => v !== i) : [...prev, i])}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${cls}`}>
                <span className={`inline-flex w-6 h-6 rounded-md border-2 border-current mr-3 items-center justify-center text-[11px] font-bold shrink-0 float-left mt-0.5 ${isChosen ? "bg-sky-500/30" : ""}`}>
                  {revealed && isCorrect && isChosen ? <Check className="w-3 h-3" /> : revealed && !isCorrect && isChosen ? <X className="w-3 h-3" /> : revealed && isCorrect ? <Circle className="w-3 h-3" /> : isChosen ? <Check className="w-3 h-3" /> : ""}
                </span>
                {opt}
              </button>
            );
          })}
          {revealed && currentQ.explanation && (
            <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3 text-xs text-sky-300"><Lightbulb className="w-3.5 h-3.5 inline mr-1.5 text-sky-400" />{currentQ.explanation}</div>
          )}
        </div>
      )}

      {/* ── True / False ── */}
      {qt === "truefalse" && (
        <div className="flex gap-3">
          {["True", "False"].map((label, i) => {
            const isCorrect = i === (currentQ.correct ?? 0);
            const isChosen = i === chosen;
            let cls = "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-sky-400/60";
            if (revealed) cls = isCorrect ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold"
              : isChosen ? "border-rose-500 bg-rose-500/15 text-rose-300" : "border-slate-800 bg-slate-900/30 text-slate-600";
            else if (isChosen) cls = "border-sky-400 bg-sky-500/15 text-sky-200";
            return (
              <button key={label} disabled={revealed} onClick={() => setChosen(i)}
                className={`flex-1 rounded-xl border py-4 text-sm font-bold transition-all ${cls}`}>
                {label === "True" ? <><Check className="w-4 h-4 inline" /> True</> : <><X className="w-4 h-4 inline" /> False</>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Fill in blank ── */}
      {qt === "fillin" && !revealed && (
        <div className="space-y-2">
          {blankCount === 0 ? (
            <p className="text-xs text-amber-400 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-400" />No blanks found in this question. Contact your trainer.
            </p>
          ) : (
            [...Array(blankCount)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-slate-500 w-16 font-mono">Blank {i + 1}</span>
                <input type="text" placeholder="Type answer…"
                  value={inputs[i] ?? ""}
                  onChange={e => { const n = [...inputs]; n[i] = e.target.value; setInputs(n); }}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            ))
          )}
        </div>
      )}
      {qt === "fillin" && revealed && (
        <div className="space-y-1">
          {(currentQ.blanks ?? []).map((ans, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-slate-500 text-xs w-16">Blank {i + 1}</span>
              <span className={`px-3 py-1 rounded-lg font-mono ${(inputs[i] ?? "").trim().toLowerCase() === ans.trim().toLowerCase() ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                {inputs[i] || "—"}
              </span>
              <span className="text-slate-500 text-xs">→ {ans}</span>
            </div>
          ))}
          {currentQ.explanation && <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3 text-xs text-sky-300 mt-2"><Lightbulb className="w-3.5 h-3.5 inline mr-1.5 text-sky-400" />{currentQ.explanation}</div>}
        </div>
      )}

      {/* ── Matching ── */}
      {qt === "matching" && !revealed && currentQ.leftColumn && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Match each item on the left with the correct item on the right</p>
          {currentQ.leftColumn.map((leftItem, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white">{leftItem}</div>
              <span className="text-slate-500 shrink-0">↔</span>
              <select
                value={matchPairs[leftItem] ?? ""}
                onChange={e => setMatchPairs(prev => ({ ...prev, [leftItem]: e.target.value }))}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none">
                <option value="">— select —</option>
                {(currentQ.rightColumn ?? []).map((r, ri) => (
                  <option key={ri} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
      {qt === "matching" && revealed && currentQ.leftColumn && (
        <div className="space-y-2">
          {currentQ.leftColumn.map((leftItem, i) => {
            const correctRight = (currentQ.correctPairs ?? {})[leftItem];
            const studentRight = matchPairs[leftItem];
            const isCorrect = studentRight === correctRight;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-white">{leftItem}</span>
                <span className={`flex-1 rounded-xl border px-3 py-2 ${isCorrect ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-rose-500 bg-rose-500/10 text-rose-300"}`}>
                  {studentRight || "—"} {isCorrect ? <Check className="w-4 h-4 inline text-emerald-400" /> : <><X className="w-4 h-4 inline text-rose-400" /> Correct: {correctRight}</>}
                </span>
              </div>
            );
          })}
          {currentQ.explanation && <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3 text-xs text-sky-300 mt-2"><Lightbulb className="w-3.5 h-3.5 inline mr-1.5 text-sky-400" />{currentQ.explanation}</div>}
        </div>
      )}

      {/* ── Ordering ── */}
      {qt === "ordering" && !revealed && currentQ.items && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Drag to reorder, or use the arrows to arrange in the correct sequence</p>
          {displayOrder.map((itemIdx, pos) => (
            <div key={itemIdx} className="flex items-center gap-2">
              <span className="shrink-0 w-7 h-7 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center border border-slate-700">{pos + 1}</span>
              <div className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white">
                {currentQ.items?.[itemIdx]}
              </div>
              <div className="flex flex-col gap-0.5">
                <button disabled={pos === 0} onClick={() => {
                  const next = [...displayOrder];
                  [next[pos], next[pos - 1]] = [next[pos - 1], next[pos]];
                  setOrderedItems(next);
                }} className="text-slate-500 hover:text-white disabled:opacity-20 text-xs px-1 rounded hover:bg-slate-700">▲</button>
                <button disabled={pos === displayOrder.length - 1} onClick={() => {
                  const next = [...displayOrder];
                  [next[pos], next[pos + 1]] = [next[pos + 1], next[pos]];
                  setOrderedItems(next);
                }} className="text-slate-500 hover:text-white disabled:opacity-20 text-xs px-1 rounded hover:bg-slate-700">▼</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {qt === "ordering" && revealed && currentQ.items && currentQ.correctOrder && (
        <div className="space-y-2">
          {currentQ.correctOrder.map((correctIdx, pos) => {
            const studentIdx = orderedItems[pos];
            const isCorrect = studentIdx === correctIdx;
            return (
              <div key={pos} className="flex items-center gap-2 text-sm">
                <span className="shrink-0 w-7 h-7 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center border border-slate-700">{pos + 1}</span>
                <span className={`flex-1 rounded-xl border px-3 py-2 ${isCorrect ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-rose-500 bg-rose-500/10 text-rose-300"}`}>
                  {currentQ.items?.[studentIdx] ?? "—"} {isCorrect ? <Check className="w-4 h-4 inline text-emerald-400" /> : <><X className="w-4 h-4 inline text-rose-400" /> Correct: {currentQ.items?.[correctIdx]}</>}
                </span>
              </div>
            );
          })}
          {currentQ.explanation && <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3 text-xs text-sky-300 mt-2"><Lightbulb className="w-3.5 h-3.5 inline mr-1.5 text-sky-400" />{currentQ.explanation}</div>}
        </div>
      )}

      {/* ── Short Answer ── */}
      {qt === "short" && !revealed && (
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none resize-none"
          placeholder="Write your answer in 1–3 sentences…" />
      )}

      {/* ── Essay ── */}
      {qt === "essay" && !revealed && (
        <div className="space-y-2">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={7}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none resize-y leading-relaxed"
            placeholder="Write your essay response…" />
          <p className="text-xs text-slate-600">{text.trim().split(/\s+/).filter(Boolean).length} words</p>
        </div>
      )}

      {/* ── Coding ── */}
      {qt === "coding" && !revealed && (
        <div className="space-y-2">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm text-emerald-300 focus:border-sky-500 focus:outline-none resize-y"
            placeholder="// Write your code here…"
            spellCheck={false} />
          <p className="text-xs text-slate-600">{text.split("\n").length} lines</p>
        </div>
      )}


      {/* ── File Upload ── */}
      {qt === "file_upload" && !revealed && (
        <div className="rounded-xl border-2 border-dashed border-slate-700 p-6 text-center space-y-3">
          <p className="text-3xl">📎</p>
          <p className="text-sm text-slate-400">
            Upload your file{currentQ.allowedFormats?.length ? ` (${currentQ.allowedFormats.join(", ")})` : ""}
          </p>
          <input id="quiz-file-upload" type="file"
            accept={currentQ.allowedFormats?.map(f => `.${f}`).join(",") ?? "*"}
            onChange={e => { const f = e.target.files?.[0]; if (f) setText(f.name); }}
            className="hidden" />
          <button type="button"
            onClick={() => { const el = document.getElementById("quiz-file-upload") as HTMLInputElement | null; if (el) cheat.active ? openFilePicker(el) : el.click(); }}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition">
            Choose File
          </button>
          {text && <p className="text-xs text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Selected: {text}</p>}
        </div>
      )}

      {/* ── Drawing / Diagram ── */}
      {qt === "drawing" && !revealed && (
        <div className="rounded-xl border-2 border-dashed border-slate-700 p-6 text-center space-y-3">
          <p className="text-3xl">🎨</p>
          <p className="text-sm text-slate-400">Upload a photo or image of your drawing/diagram</p>
          <input id="quiz-drawing-upload" type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
            onChange={e => { const f = e.target.files?.[0]; if (f) setText(f.name); }}
            className="hidden" />
          <button type="button"
            onClick={() => { const el = document.getElementById("quiz-drawing-upload") as HTMLInputElement | null; if (el) cheat.active ? openFilePicker(el) : el.click(); }}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold transition">
            Choose Image
          </button>
          {text && <p className="text-xs text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Selected: {text}</p>}
        </div>
      )}

      {/* ── Audio ── */}
      {qt === "audio" && !revealed && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3 text-center">
          <div className="flex justify-center"><Mic className="w-8 h-8 text-slate-400" /></div>
          <p className="text-sm text-slate-400">Record or upload an audio response</p>
          <input id="quiz-audio-upload" type="file" accept=".mp3,.wav,.ogg,.m4a,.webm"
            onChange={e => { const f = e.target.files?.[0]; if (f) setText(f.name); }}
            className="hidden" />
          <button type="button"
            onClick={() => { const el = document.getElementById("quiz-audio-upload") as HTMLInputElement | null; if (el) cheat.active ? openFilePicker(el) : el.click(); }}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition">
            Choose Audio File
          </button>
          {text && <p className="text-xs text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Selected: {text}</p>}
        </div>
      )}

      {/* ── Video ── */}
      {qt === "video" && !revealed && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3 text-center">
          <p className="text-3xl">🎥</p>
          <p className="text-sm text-slate-400">Upload a video response</p>
          <input id="quiz-video-upload" type="file" accept=".mp4,.webm,.mov,.avi"
            onChange={e => { const f = e.target.files?.[0]; if (f) setText(f.name); }}
            className="hidden" />
          <button type="button"
            onClick={() => { const el = document.getElementById("quiz-video-upload") as HTMLInputElement | null; if (el) cheat.active ? openFilePicker(el) : el.click(); }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition">
            Choose Video File
          </button>
          {text && <p className="text-xs text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Selected: {text}</p>}
        </div>
      )}

      {/* ── Revealed: subjective answer review ── */}
      {revealed && ["short", "essay", "coding"].includes(qt) && (
        <div className="space-y-2">
          <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3">
            <p className="text-[10px] text-slate-500 uppercase mb-1">Your answer</p>
            <p className={`text-sm text-slate-300 whitespace-pre-wrap ${qt === "coding" ? "font-mono text-emerald-300" : ""}`}>{text}</p>
          </div>
          {currentQ.sampleAnswer && (
            <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 px-4 py-3">
              <p className="text-[10px] font-bold text-sky-400 uppercase mb-1"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Model answer</p>
              <p className={`text-sm text-slate-300 ${qt === "coding" ? "font-mono text-emerald-300 whitespace-pre-wrap" : ""}`}>{currentQ.sampleAnswer}</p>
            </div>
          )}
          <p className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1"><Check className="w-3 h-3" /> Submitted — your teacher will review and grade this.</p>
        </div>
      )}
      {revealed && ["file_upload", "drawing", "audio", "video"].includes(qt) && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="text-sm text-emerald-300 font-bold inline-flex items-center gap-1"><Check className="w-4 h-4" /> Submitted</p>
          <p className="text-xs text-slate-400 mt-1">Your teacher will review this submission and provide a grade.</p>
        </div>
      )}

      {/* ── Submit / Next button ── */}
      {timedOut.has(qIdx) && !revealed ? (
        /* Question timed out before submit — show locked state */
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-rose-300">⏱ Time expired</p>
            <p className="text-xs text-slate-500 mt-0.5">This question was auto-submitted as blank.</p>
          </div>
          {qIdx < questions.length - 1 && (
            <button
              onClick={() => { setQIdx(i => i + 1); setChosen(null); setInputs([]); setText(""); setMultiSel([]); setMatchPairs({}); setOrderedItems([]); setRevealed(false); }}
              className={`px-4 py-2 rounded-xl bg-gradient-to-r ${tierGrad} text-white text-sm font-bold transition shrink-0 ml-3`}>
              Next →
            </button>
          )}
        </div>
      ) : !revealed ? (
        <button
          disabled={
            // MCQ — must choose an option (and options must exist)
            qt === "mcq" ? (chosen === null || (currentQ?.options ?? []).length === 0) :
              // True/False — must choose
              qt === "truefalse" ? chosen === null :
                // Fill-in — all blanks must have a non-empty value
                qt === "fillin" ? (blankCount === 0 ? false : inputs.filter(s => s && s.trim().length > 0).length < blankCount) :
                  // Multi-select — at least one choice
                  qt === "multiselect" ? (multiSel.length === 0 || (currentQ?.options ?? []).length === 0) :
                    // Matching — every left item must have a non-empty selection
                    qt === "matching" ? (
                      (currentQ?.leftColumn ?? []).length === 0 ? false :
                        (currentQ?.leftColumn ?? []).some(k => !matchPairs[k] || matchPairs[k] === "")
                    ) :
                      // Ordering — items must be initialised (at least 1 item)
                      qt === "ordering" ? (
                        (currentQ?.items ?? []).length === 0 ? false : displayOrder.length === 0
                      ) :
                        // Short / essay / coding — at least a few characters
                        ["short", "essay", "coding"].includes(qt) ? text.trim().length < 3 :
                          // File types — filename must be set (user picked a file)
                          ["file_upload", "drawing", "audio", "video"].includes(qt) ? text.trim().length === 0 :
                            false
          }
          onClick={submit}
          className={`w-full rounded-xl bg-gradient-to-r ${tierGrad} disabled:opacity-40 py-3 text-sm font-bold text-white transition shadow hover:shadow-lg hover:scale-105 disabled:scale-100 disabled:pointer-events-none`}>
          {qIdx < questions.length - 1 ? "Submit & Next →" : "Submit Answer →"}
        </button>
      ) : qIdx < questions.length - 1 ? (
        <button
          onClick={() => { setQIdx(i => i + 1); setChosen(null); setInputs([]); setText(""); setMultiSel([]); setMatchPairs({}); setOrderedItems([]); setRevealed(false); }}
          className={`w-full rounded-xl bg-gradient-to-r ${tierGrad} py-2.5 text-sm font-bold text-white transition`}>
          Next Question →
        </button>
      ) : null}
    </div>
  );
  // ── Shared card content ───────────────────────────────────────────────────
  const cardInner = (
    <>
      {/* Progress dots + timer */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5 flex-1">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${timedOut.has(i) ? "bg-rose-500" :
              i < qIdx ? "bg-emerald-500" :
                i === qIdx ? "bg-sky-400" : "bg-slate-700"
              }`} />
          ))}
        </div>
        <span className="text-[10px] font-bold text-slate-500 shrink-0">{qIdx + 1}/{questions.length}</span>

        {/* Countdown timer */}
        {timeLeft !== null && !revealed && (
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg tabular-nums ${timeLeft <= 10 ? "bg-rose-500/20 text-rose-300 animate-pulse" :
            timeLeft <= 30 ? "bg-amber-500/20 text-amber-300" :
              "bg-slate-800 text-slate-400"
            }`}>
            ⏱ {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        )}
        {timeLeft === 0 && (
          <span className="text-xs font-bold text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-lg">⏱ Time up!</span>
        )}

        {cheat.active && (
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Secure {cheat.strikes > 0 ? <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {cheat.strikes}/2</span> : ""}
          </span>
        )}
      </div>

      {cheat.warning && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0
          }}
        >
          <div className="max-w-md w-full mx-4 rounded-xl border-2 border-rose-500 bg-gradient-to-br from-rose-950 to-slate-900 p-6 space-y-4 shadow-2xl animate-pulse-slow">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-rose-200 text-lg mb-2">⚠️ EXAM VIOLATION DETECTED</h3>
                <p className="font-semibold text-rose-300 text-base">{cheat.warning}</p>
                <p className="text-sm text-rose-400/80 mt-2">Strike {cheat.strikes} of 2 has been recorded and reported to your trainer.</p>
                <p className="text-xs text-rose-400/60 mt-3 italic">Stay in fullscreen mode. One more violation will auto-submit your quiz.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissWarning()}
              autoFocus
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-base font-bold py-4 transition-all shadow-lg hover:shadow-rose-500/50 focus:ring-4 focus:ring-rose-500/50"
              style={{ cursor: "pointer", pointerEvents: "auto" }}>
              <Check className="w-5 h-5" /> I Understand — Continue Quiz
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen restore banner — shown when file picker exits fullscreen */}
      {cheat.needsFullscreenRestore && !cheat.warning && (
        <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 space-y-3 mb-2">
          <div className="flex gap-3 items-start">
            <Lock className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sky-200 text-sm">Exam fullscreen closed</p>
              <p className="text-xs text-sky-300/70 mt-1">
                The file picker caused the exam to exit fullscreen. Click the button below to return.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => restoreFullscreen()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-bold py-3 transition-colors"
            style={{ cursor: "pointer", pointerEvents: "auto" }}>
            <Lock className="w-4 h-4" /> Return to Fullscreen Exam Mode
          </button>
        </div>
      )}

      {questionUI}
    </>
  );

  // ── Active quiz: fullscreen overlay ──────────────────────────────────────
  if (cheat.active) {
    return (
      <>
        <div ref={containerRef} className="hidden" />
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999, overflow: "auto",
          background: "linear-gradient(135deg,#080d18 0%,#0d1526 100%)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Exam header bar */}
          <div style={{
            borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
            background: "rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "#10b981",
                boxShadow: "0 0 8px #10b981", display: "inline-block"
              }} />
              <span style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Secure Exam Mode
              </span>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <span style={{ color: "#64748b", fontSize: 12 }}>{block.title ?? "Quiz"}</span>
              {cheat.strikes > 0 && (
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12 }} className="flex items-center gap-1">
                  <AlertTriangle style={{ width: 12, height: 12, display: "inline" }} /> {cheat.strikes}/2 warnings
                </span>
              )}
              <span style={{ color: "#475569", fontSize: 12 }}>{userName ?? "Student"}</span>
            </div>
          </div>

          {/* Quiz card — centred, max-width, only content visible */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "40px 16px" }}>
            <div style={{ width: "100%", maxWidth: 640, pointerEvents: "auto" }}>
              <div style={{
                background: "rgba(15,23,42,0.95)",
                border: `1px solid ${tier === "l3" ? "rgba(16,185,129,0.2)" : tier === "l5" ? "rgba(167,139,250,0.2)" : "rgba(56,189,248,0.2)"}`,
                borderRadius: 20, padding: "28px 28px",
                boxShadow: `0 0 60px ${tier === "l3" ? "rgba(16,185,129,0.06)" : tier === "l5" ? "rgba(167,139,250,0.06)" : "rgba(56,189,248,0.06)"}`,
                pointerEvents: "auto",
              }}>
                {cardInner}
              </div>
            </div>
          </div>

          {/* Footer policy notice */}
          <div style={{
            padding: "8px 24px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(0,0,0,0.4)", flexShrink: 0
          }}>
            <span style={{ color: "#475569", fontSize: 11 }} className="flex items-center gap-1">
              <Shield style={{ width: 12, height: 12, display: "inline" }} /> Monitored exam — tab switching, copying, printing and developer tools are prohibited.
            </span>
          </div>
        </div>
      </>
    );
  }

  // ── Normal (non-active) card ──────────────────────────────────────────────
  return (
    <>
      <div ref={containerRef} className="hidden" />
      {nodeId && blockId && <QuizResponseTracker nodeId={nodeId} blockId={blockId} tier={tier} />}
      {/* Admin exit password dialog — only visible when Ctrl+Shift+E is pressed */}
      {quizStarted && !done && <AdminExitDialog />}
      <div className={`rounded-2xl border bg-slate-900/60 p-5 my-4 shadow-lg ${tierBorder}`}>
        {cardInner}
      </div>
    </>
  );
}

// ─── ChecklistBlock ───────────────────────────────────────────────────────────

function ChecklistBlockView({ block, done, onAllDone }: { block: ChecklistBlock; done: boolean; onAllDone: () => void }) {
  const [checked, setChecked] = useState<boolean[]>(block.items.map(() => done));
  const allDone = checked.every(Boolean);
  function toggle(i: number) {
    const next = [...checked]; next[i] = !next[i]; setChecked(next);
    if (next.every(Boolean)) onAllDone();
  }
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3 my-4">
      <div className="flex items-center gap-2">
        <ListChecks className="w-5 h-5 text-amber-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Self-Check</p>
        {allDone && <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400 font-bold animate-pulse"><CheckCircle2 className="w-3.5 h-3.5" /> All done!</span>}
      </div>
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-all ${checked[i] ? "bg-emerald-500/5 border border-emerald-500/20" : "hover:bg-slate-800/40 border border-transparent"}`}>
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${checked[i] ? "bg-emerald-500 border-emerald-400" : "border-slate-600"}`}
              onClick={() => toggle(i)}>
              {checked[i] && <Check className="w-3 h-3 text-white" />}
            </div>
            <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} className="sr-only" />
            <span className={`text-sm leading-snug transition-all ${checked[i] ? "line-through text-slate-500" : "text-slate-300"}`}>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── DocumentBlockView — immersive PDF/doc reader ────────────────────────────

function DocumentBlockView({ block, onView }: { block: import("@/lib/learnContent").DocumentBlock; onView: () => void }) {
  const [mode, setMode] = useState<"preview" | "embed">("preview");
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) { fired.current = true; onView(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onView]);

  const isPdf = block.fileType?.includes("pdf") || block.url?.toLowerCase().endsWith(".pdf");
  const embedUrl = isPdf ? `${block.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH` : block.url;

  return (
    <div ref={ref} className="rounded-2xl border border-violet-500/30 bg-slate-900 overflow-hidden my-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-violet-600/20 to-slate-900 border-b border-violet-500/20">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-7 h-7 shrink-0 text-violet-400" />
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate">{block.title || "Document"}</p>
            {block.description && <p className="text-xs text-slate-400 truncate mt-0.5">{block.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPdf && (
            <button
              onClick={() => setMode(m => m === "embed" ? "preview" : "embed")}
              className="text-xs px-3 py-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition font-medium"
            >
              {mode === "embed" ? <><ChevronLeft className="w-3.5 h-3.5" /> Collapse</> : <><BookOpen className="w-3.5 h-3.5" /> Read inline</>}
            </button>
          )}
          <a href={block.url} target="_blank" rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-500 transition font-medium">
            ↗ Open
          </a>
          {block.url && (
            <a href={block.url} download
              className="text-xs px-3 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition font-medium">
              ⬇ Download
            </a>
          )}
        </div>
      </div>

      {/* Inline PDF embed */}
      {mode === "embed" && isPdf && block.url && (
        <div className="relative bg-slate-950" style={{ height: "72vh" }}>
          <iframe
            src={embedUrl}
            className="w-full h-full"
            title={block.title || "Document"}
            allow="fullscreen"
          />
        </div>
      )}

      {/* Non-PDF preview */}
      {mode === "preview" && !isPdf && block.url && (
        <div className="px-5 py-6 text-center space-y-3">
          <p className="text-slate-400 text-sm">Click "Open" to view this document in a new tab.</p>
        </div>
      )}

      {/* Preview thumbnail for PDF */}
      {mode === "preview" && isPdf && block.url && (
        <button
          onClick={() => setMode("embed")}
          className="w-full group relative overflow-hidden"
          style={{ height: 200 }}
        >
          <iframe
            src={`${block.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full pointer-events-none scale-100 group-hover:scale-[1.02] transition duration-500"
            title="preview"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex items-end justify-center pb-6">
            <span className="rounded-full bg-violet-600 text-white text-sm font-bold px-6 py-2.5 shadow-lg shadow-violet-900/50 group-hover:bg-violet-500 transition flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Open reader
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

// ─── ImageBlockView — lightbox viewer ────────────────────────────────────────

function ImageBlockView({ block, onView }: { block: import("@/lib/learnContent").ImageBlock; onView: () => void }) {
  const [lightbox, setLightbox] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) { fired.current = true; onView(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onView]);

  if (!block.url) return null;

  return (
    <div ref={ref} className="my-4">
      {/* Clickable image */}
      <button
        onClick={() => setLightbox(true)}
        className="group w-full rounded-2xl overflow-hidden border border-slate-700 hover:border-sky-500/50 transition shadow-lg relative block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.url}
          alt={block.alt || block.caption || "diagram"}
          className="w-full object-contain max-h-[480px] bg-slate-900 group-hover:scale-[1.01] transition duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition text-white text-sm font-bold bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
            🔍 Click to enlarge
          </span>
        </div>
      </button>
      {block.caption && (
        <p className="text-center text-xs text-slate-500 mt-2 italic">{block.caption}</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white rounded-full p-1 transition"
            onClick={() => setLightbox(false)}
          ><X className="w-6 h-6" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.alt || block.caption || "diagram"}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          {block.caption && (
            <p className="mt-4 text-sm text-slate-400 italic text-center max-w-lg">{block.caption}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── VideoBlockView — embedded player ────────────────────────────────────────

function VideoBlockView({ block, onView }: { block: import("@/lib/learnContent").VideoBlock; onView: () => void }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) { fired.current = true; onView(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onView]);

  if (!block.url) return null;

  // Convert YouTube/Vimeo to embed URL
  function getEmbedUrl(url: string): string | null {
    // YouTube: watch?v=ID or youtu.be/ID or /embed/ID
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    // Vimeo
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`;
    // Direct video file
    if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return null; // use <video> tag
    return null;
  }

  const embedUrl = getEmbedUrl(block.url);
  const isDirectVideo = !embedUrl && block.url.match(/\.(mp4|webm|ogg)(\?|$)/i);

  return (
    <div ref={ref} className="rounded-2xl border border-slate-700 overflow-hidden my-4 shadow-xl bg-slate-900">
      {/* Header */}
      {(block.title || block.description) && (
        <div className="px-5 py-3 border-b border-slate-800">
          {block.title && <p className="font-bold text-white text-sm">{block.title}</p>}
          {block.description && <p className="text-xs text-slate-400 mt-0.5">{block.description}</p>}
        </div>
      )}

      {/* Video area */}
      {!playing ? (
        /* Thumbnail / play button */
        <button
          onClick={() => { setPlaying(true); }}
          className="w-full relative group bg-slate-950 flex items-center justify-center"
          style={{ aspectRatio: "16/9" }}
        >
          {/* YouTube thumbnail if possible */}
          {block.url.includes("youtube") && (() => {
            const m = block.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
            return m ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg`}
                alt="video thumbnail"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition duration-300"
              />
            ) : null;
          })()}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="w-20 h-20 rounded-full bg-sky-500/90 group-hover:bg-sky-400 transition shadow-2xl shadow-sky-900/50 flex items-center justify-center">
              <Play className="w-9 h-9 text-white ml-1 fill-white" />
            </span>
            <span className="text-white text-sm font-semibold drop-shadow">Click to play</span>
          </div>
        </button>
      ) : embedUrl ? (
        /* Embedded iframe player */
        <div style={{ aspectRatio: "16/9" }}>
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={block.title || "Video"}
          />
        </div>
      ) : isDirectVideo ? (
        /* Native video player */
        <video
          src={block.url}
          controls
          autoPlay
          className="w-full"
          style={{ aspectRatio: "16/9" }}
        />
      ) : (
        /* Fallback external link */
        <div className="px-5 py-6 text-center">
          <a href={block.url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 text-white font-bold px-6 py-3 hover:bg-sky-400 transition">
            <Video className="w-4 h-4" /> Watch video
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Block dispatcher ─────────────────────────────────────────────────────────

function BlockView({ block, done, onDone, tier, nodeId, userName, trackId }: { block: LearnBlock; done: boolean; onDone: () => void; tier: string; nodeId?: string; userName?: string; trackId?: string }) {
  if (block.type === "text") return <TextBlockView block={block} onRead={onDone} tier={tier} />;
  if (block.type === "code") return <CodeBlockView block={block} onView={onDone} />;
  if (block.type === "quiz") return <QuizBlockView block={block} done={done} onAnswer={() => onDone()} tier={tier} nodeId={nodeId} blockId={block.id} userName={userName} trackId={trackId} />;
  if (block.type === "checklist") return <ChecklistBlockView block={block} done={done} onAllDone={onDone} />;
  if (block.type === "document") return <DocumentBlockView block={block} onView={onDone} />;
  if (block.type === "image") return <ImageBlockView block={block} onView={onDone} />;
  if (block.type === "video") return <VideoBlockView block={block} onView={onDone} />;
  return null;
}

// ─── Celebration confetti (pure CSS, no library) ─────────────────────────────

function Celebration({ xp, name }: { xp: number; name: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
      <div className="pointer-events-auto text-center px-10 py-8 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 space-y-4 animate-in zoom-in-75 duration-500">
        <div className="flex justify-center"><PartyPopper className="w-14 h-14 text-emerald-400 animate-bounce" /></div>
        <h2 className="text-3xl font-black text-white">Module Completed!</h2>
        <p className="text-slate-300">Incredible work, <strong className="text-white">{name}</strong>!</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-6 py-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <span className="text-xl font-black text-emerald-400">+{xp} XP</span>
        </div>
        <p className="text-xs text-slate-500">Submit evidence below to claim your reward</p>
      </div>
    </div>
  );
}

// ─── Live update banner ───────────────────────────────────────────────────────

function LiveUpdateBanner({ onReload }: { onReload: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-5 py-3 animate-in slide-in-from-top-2 duration-500">
      <RefreshCw className="w-5 h-5 text-sky-400 animate-spin shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-sky-300">Content updated by your trainer</p>
        <p className="text-xs text-slate-400">New learning material is available for this topic</p>
      </div>
      <button onClick={onReload} className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-sky-500 text-white hover:bg-sky-400 transition">
        Refresh
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LearnModuleReader({
  moduleSlug,
  module: staticModule,
  trackId: propTrackId,
  trackName,
  toc: dbToc,
  customTocEntries,
  nodes: dbNodes,
  initialProgress,
  userName,
  userId
}: Props) {
  // If database-driven module (has trackId), use that data
  const isDatabaseModule = !!propTrackId;

  // Live module — starts as static, gets replaced by DB version on mount
  const [module, setModule] = useState<LearnModule>(staticModule || {
    trackName: trackName || '',
    tier: 'l3',
    moduleCode: moduleSlug.toUpperCase(),
    title: trackName || 'Module',
    description: '',
    outcomes: [],
    slug: moduleSlug,
    xpReward: 0,
    estimatedMinutes: 0
  });
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [tableOfContents, setTableOfContents] = useState<any[]>([]);
  const [itemBlockMap, setItemBlockMap] = useState<Record<string, { itemIdx: number; blocks: LearnBlock[]; subtopicId: string }[]>>({});
  const [loadingLive, setLoadingLive] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);
  const supabase = createBrowserSupabase();

  // Fetch live content from /api/module/[moduleSlug]
  const fetchLive = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`/api/module/${moduleSlug}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.module) return;

      const blockMap: Record<string, LearnBlock[]> = data.blockMap ?? {};
      const allBlockKeys = Object.keys(blockMap);
      const fetchedNodeId: string | null = data.nodeId ?? null;
      const fetchedTrackId: string | null = data.trackId ?? null;
      const fetchedItemBlockMap = data.itemBlockMap ?? {};

      if (fetchedNodeId && fetchedNodeId !== nodeId) setNodeId(fetchedNodeId);
      // trackId is a prop, not state - cannot be set
      // if (fetchedTrackId) setTrackId(fetchedTrackId);
      setItemBlockMap(fetchedItemBlockMap);  // Store item-level block mapping
      setTableOfContents(data.tableOfContents ?? []); // Store TOC for sidebar

      // Debug: Show TOC structure
      if (data.tableOfContents && data.tableOfContents.length > 0) {
        console.log('📋 TOC Available:', data.tableOfContents.length, 'items');
        console.log('📋 TOC Structure:', data.tableOfContents.slice(0, 5));
      }

      if (allBlockKeys.length === 0) {
        if (!silent) setModule(data.module as LearnModule);
        else setHasUpdate(true);
        return;
      }

      // Patch each topic: use merged blocks from API first,
      // then fall back to blockMap by every possible key.
      let globalFlatIdx = 0;
      const patched: LearnModule = {
        ...data.module,
        outcomes: (data.module.outcomes as LearningOutcome[]).map((o) => ({
          ...o,
          indicativeContents: o.indicativeContents.map((ic) => ({
            ...ic,
            topics: ic.topics.map((t) => {
              const n = ++globalFlatIdx;
              // 1. Already has blocks from API merge
              if (t.blocks && t.blocks.length > 0) return t;
              // 2. Exact topic ID key
              if (blockMap[t.id]) return { ...t, blocks: blockMap[t.id] };
              // 3. nodeId-tN key (matches learnContent flat index)
              if (fetchedNodeId) {
                const nk = `${fetchedNodeId}-t${n}`;
                if (blockMap[nk]) return { ...t, blocks: blockMap[nk] };
              }
              // 4. Sequential key by flat position (covers any other key format)
              const seqKey = allBlockKeys[n - 1];
              if (seqKey) return { ...t, blocks: blockMap[seqKey] };
              return t;
            }),
          })),
        })),
      };

      if (!silent) setModule(patched);
      else setHasUpdate(true);
    } catch { /* non-fatal */ } finally {
      setLoadingLive(false);
    }
  }, [moduleSlug]);

  // Initial fetch
  useEffect(() => { fetchLive(false); }, [fetchLive]);

  // Supabase realtime — watch SkillNode table for block updates
  useEffect(() => {
    const channel = supabase
      .channel(`module-live:${moduleSlug}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "SkillNode",
      }, () => {
        fetchLive(true); // show banner — don't auto-replace mid-read
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [moduleSlug, supabase, fetchLive]);

  function applyUpdate() {
    setHasUpdate(false);
    fetchLive(false);
  }

  const tier = module.tier;
  const tierGrad = TIER_GRAD[tier] ?? TIER_GRAD.l4;
  const tierAccent = TIER_ACCENT[tier] ?? TIER_ACCENT.l4;
  const tierBorder = TIER_BORDER[tier] ?? TIER_BORDER.l4;

  const outcomes = module.outcomes;
  const totalBlocks = countAllBlocks(module);

  // Navigation state
  const [activeOIdx, setActiveOIdx] = useState(0);
  const [activeICIdx, setActiveICIdx] = useState(0);
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);
  const [activeItemIdx, setActiveItemIdx] = useState<number | undefined>(undefined);

  const activeOutcome: LearningOutcome = outcomes[activeOIdx] ?? outcomes[0];
  const activeIC: IndicativeContent = activeOutcome.indicativeContents[activeICIdx] ?? activeOutcome.indicativeContents[0];
  const activeTopic: LearnTopic = activeIC.topics[activeTopicIdx] ?? activeIC.topics[0];

  // Get blocks for the active view — item-specific blocks if item is selected, otherwise topic blocks
  const activeBlocks = (() => {
    // When an item is selected, ONLY show that item's content (no fallback to topic)
    if (activeItemIdx !== undefined) {
      const topicKey = `${activeOIdx}-${activeICIdx}-${activeTopicIdx}`;
      const itemMappings = itemBlockMap[topicKey];

      // Debug logging
      console.log('🔍 Item selected:', {
        activeItemIdx,
        topicKey,
        itemMappings,
        itemBlockMapKeys: Object.keys(itemBlockMap),
        fullItemBlockMap: itemBlockMap,
      });

      if (itemMappings) {
        const itemMapping = itemMappings.find(m => m.itemIdx === activeItemIdx);
        console.log('🎯 Found item mapping:', itemMapping);
        if (itemMapping && itemMapping.blocks.length > 0) {
          return itemMapping.blocks;
        }
      }
      // Item selected but no content found - return empty array (DO NOT fall back to topic blocks)
      console.log('❌ No content found for this item');
      return [];
    }
    // No item selected - show all topic blocks
    console.log('📚 No item selected, showing topic blocks:', activeTopic.blocks.length);
    return activeTopic.blocks;
  })();

  // Scroll main area to top on topic change (but NOT on item change within same topic)
  const mainRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const prevTopicRef = useRef<string>(`${activeOIdx}-${activeICIdx}-${activeTopicIdx}`);

  useEffect(() => {
    const currentTopic = `${activeOIdx}-${activeICIdx}-${activeTopicIdx}`;
    // Only scroll main content if topic changed (not just item within same topic)
    if (currentTopic !== prevTopicRef.current) {
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      prevTopicRef.current = currentTopic;
    }
    // Never scroll sidebar - let it stay where user positioned it
  }, [activeOIdx, activeICIdx, activeTopicIdx, activeItemIdx]);

  // Per-block completion
  const [doneBlocks, setDoneBlocks] = useState<Set<string>>(new Set());
  const completedCount = doneBlocks.size;
  const livePct = totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0;

  function topicPct(topic: LearnTopic) {
    if (!topic.blocks.length) return 0;
    return Math.round((topic.blocks.filter(b => doneBlocks.has(b.id)).length / topic.blocks.length) * 100);
  }
  function outcomePct(outcome: LearningOutcome) {
    const all = outcome.indicativeContents.flatMap(ic => ic.topics.flatMap(t => t.blocks));
    if (!all.length) return 0;
    return Math.round((all.filter(b => doneBlocks.has(b.id)).length / all.length) * 100);
  }

  // Progress save
  const [status, setStatus] = useState(initialProgress?.status ?? "studying");
  const [celebrating, setCelebrating] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, startTransition] = useTransition();
  const celebrationFired = useRef(false);
  const lastSaved = useRef(initialProgress?.readPct ?? 0);

  // Module reading context for AI Assistant
  const { setContext: setModuleContext } = useModuleReading();

  // Update context whenever navigation changes
  useEffect(() => {
    setModuleContext({
      moduleCode: module.moduleCode,
      moduleTitle: module.title,
      moduleSlug: moduleSlug,
      currentOutcome: {
        index: activeOIdx,
        title: activeOutcome.title,
      },
      currentIndicativeContent: {
        index: activeICIdx,
        title: activeIC.title,
      },
      currentTopic: {
        index: activeTopicIdx,
        title: activeTopic.title,
      },
      currentItem: activeItemIdx !== undefined ? {
        index: activeItemIdx,
      } : undefined,
      currentBlocks: activeBlocks.map(block => ({
        id: block.id,
        type: block.type,
        content: block,
      })),
      progressPercent: livePct,
      completedBlocks: completedCount,
      totalBlocks: totalBlocks,
    });

    // Cleanup context when component unmounts
    return () => {
      setModuleContext(null);
    };
  }, [
    module.moduleCode,
    module.title,
    moduleSlug,
    activeOIdx,
    activeICIdx,
    activeTopicIdx,
    activeItemIdx,
    activeOutcome.title,
    activeIC.title,
    activeTopic.title,
    activeBlocks,
    livePct,
    completedCount,
    totalBlocks,
    setModuleContext,
  ]);

  const saveProgress = useCallback((pct: number, newStatus?: string) => {
    if (Math.abs(pct - lastSaved.current) < 5 && !newStatus) return;
    lastSaved.current = pct;
    startTransition(async () => {
      await fetch(`/api/learn/${moduleSlug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readPct: pct, status: newStatus ?? status }),
      });
    });
  }, [moduleSlug, status]);

  useEffect(() => {
    if (livePct >= 100 && !celebrationFired.current) {
      celebrationFired.current = true;
      setCelebrating(true);
      setStatus("done");
      saveProgress(100, "done");
      setTimeout(() => setCelebrating(false), 5000);
    } else {
      saveProgress(livePct);
    }
  }, [livePct, saveProgress]);

  function markDone(id: string) {
    setDoneBlocks(prev => prev.has(id) ? prev : new Set([...prev, id]));
  }

  function navigate(oIdx: number, icIdx: number, topicIdx: number, itemIdx?: number) {
    // Update navigation state - StudentModuleSidebar will handle expanding the hierarchy
    setActiveOIdx(oIdx);
    setActiveICIdx(icIdx);
    setActiveTopicIdx(topicIdx);
    setActiveItemIdx(itemIdx);
    setSidebarOpen(false);
  }

  function goNext() {
    const ics = activeOutcome.indicativeContents;
    const topics = activeIC.topics;
    if (activeTopicIdx < topics.length - 1) return navigate(activeOIdx, activeICIdx, activeTopicIdx + 1);
    if (activeICIdx < ics.length - 1) return navigate(activeOIdx, activeICIdx + 1, 0);
    if (activeOIdx < outcomes.length - 1) return navigate(activeOIdx + 1, 0, 0);
  }

  function goPrev() {
    if (activeTopicIdx > 0) return navigate(activeOIdx, activeICIdx, activeTopicIdx - 1);
    if (activeICIdx > 0) {
      const prevIC = activeOutcome.indicativeContents[activeICIdx - 1];
      return navigate(activeOIdx, activeICIdx - 1, prevIC.topics.length - 1);
    }
    if (activeOIdx > 0) {
      const prevO = outcomes[activeOIdx - 1];
      const lastIC = prevO.indicativeContents[prevO.indicativeContents.length - 1];
      return navigate(activeOIdx - 1, prevO.indicativeContents.length - 1, lastIC.topics.length - 1);
    }
  }

  const isFirst = activeOIdx === 0 && activeICIdx === 0 && activeTopicIdx === 0;
  const lastO = outcomes[outcomes.length - 1];
  const lastIC2 = lastO.indicativeContents[lastO.indicativeContents.length - 1];
  const isLast = activeOIdx === outcomes.length - 1 &&
    activeICIdx === lastO.indicativeContents.length - 1 &&
    activeTopicIdx === lastIC2.topics.length - 1;

  const statusColor = status === "verified" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
    : status === "done" ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
      : "border-amber-500/50 bg-amber-500/10 text-amber-300";
  const statusLabel = status === "verified" ? "✦ Verified" : status === "done" ? "◉ Completed" : "◎ In Progress";

  function submitEvidence() {
    startTransition(async () => {
      await fetch(`/api/learn/${moduleSlug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readPct: 100, status: "done", evidenceUrl }),
      });
      setSubmitted(true);
    });
  }

  // ─── Sidebar ────────────────────────────────────────────────────────────────

  // Map TOC item selection to navigation indices
  const handleTOCSelect = useCallback((item: any) => {
    console.log('🎯 TOC item selected:', item);

    // LEVEL 4: Items (new format: default-item-X-Y-Z-N or legacy: item-X-Y-Z-N)
    if (item.type === 'item' || item._isItem) {
      // Try new format first: default-item-{oIdx}-{icIdx}-{tIdx}-{itemIdx}
      let match = item.id.match(/default-item-(\d+)-(\d+)-(\d+)-(\d+)/);
      if (match) {
        const [, oIdx, icIdx, tIdx, itemIdx] = match.map(Number);
        console.log(`📄 Navigating to item: outcome=${oIdx}, ic=${icIdx}, topic=${tIdx}, item=${itemIdx}`);
        navigate(oIdx, icIdx, tIdx, itemIdx);
        return;
      }

      // Try legacy format: item-{oIdx}-{icIdx}-{tIdx}-{itemIdx}
      match = item.id.match(/item-(\d+)-(\d+)-(\d+)-(\d+)/);
      if (match) {
        const [, oIdx, icIdx, tIdx, itemIdx] = match.map(Number);
        console.log(`📄 Navigating to item (legacy): outcome=${oIdx}, ic=${icIdx}, topic=${tIdx}, item=${itemIdx}`);
        navigate(oIdx, icIdx, tIdx, itemIdx);
        return;
      }
    }

    // LEVEL 3: Subtopics - find parent topic and outcome
    if (item.type === 'subtopic') {
      const parentTopic = tableOfContents.find((t: any) => t.id === item.parentId && t.type === 'topic');
      if (parentTopic) {
        const parentOutcome = tableOfContents.find((o: any) => o.id === parentTopic.parentId && o.type === 'outcome');
        if (parentOutcome) {
          const outcomes = tableOfContents.filter((t: any) => t.type === 'outcome');
          const topics = tableOfContents.filter((t: any) => t.type === 'topic' && t.parentId === parentOutcome.id);

          const oIdx = outcomes.findIndex((o: any) => o.id === parentOutcome.id);
          const tIdx = topics.findIndex((t: any) => t.id === parentTopic.id);

          console.log(`📙 Navigating to subtopic: outcome=${oIdx}, topic=${tIdx}`);
          navigate(oIdx, 0, tIdx);
          return;
        }
      }
    }

    // LEVEL 2: Topics - find parent outcome
    if (item.type === 'topic') {
      const parentOutcome = tableOfContents.find((o: any) => o.id === item.parentId && o.type === 'outcome');
      if (parentOutcome) {
        const outcomes = tableOfContents.filter((t: any) => t.type === 'outcome');
        const topics = tableOfContents.filter((t: any) => t.type === 'topic' && t.parentId === parentOutcome.id);

        const oIdx = outcomes.findIndex((o: any) => o.id === parentOutcome.id);
        const tIdx = topics.findIndex((t: any) => t.id === item.id);

        console.log(`📗 Navigating to topic: outcome=${oIdx}, topic=${tIdx}`);
        navigate(oIdx, 0, tIdx);
        return;
      }
    }

    // LEVEL 1: Outcomes
    if (item.type === 'outcome') {
      const outcomes = tableOfContents.filter((t: any) => t.type === 'outcome');
      const oIdx = outcomes.findIndex((o: any) => o.id === item.id);
      console.log(`📘 Navigating to outcome: ${oIdx}`);
      navigate(oIdx, 0, 0);
      return;
    }

    // Fallback: go to first item
    console.log('⚠️ Unknown TOC item type, navigating to start');
    navigate(0, 0, 0);
  }, [navigate, tableOfContents]);

  // Memoize sidebar content to prevent re-renders
  const sidebarComponent = useMemo(() => {
    // Calculate active ID for TOC sidebar
    let activeId = null;
    if (tableOfContents.length > 0) {
      if (activeItemIdx !== undefined) {
        // Item is selected - find its ID
        activeId = `default-item-${activeOIdx}-${activeICIdx}-${activeTopicIdx}-${activeItemIdx}`;
      } else {
        // Find the corresponding TOC item for current navigation state
        const outcomes = tableOfContents.filter((t: any) => t.type === 'outcome');
        const currentOutcome = outcomes[activeOIdx];
        if (currentOutcome) {
          const topics = tableOfContents.filter((t: any) => t.type === 'topic' && t.parentId === currentOutcome.id);
          const currentTopic = topics[activeTopicIdx];
          if (currentTopic) {
            activeId = currentTopic.id;
          } else {
            activeId = currentOutcome.id;
          }
        }
      }
    }

    // Use TOC-based sidebar if TOC is available
    if (tableOfContents.length > 0) {
      return (
        <StudentModuleSidebarTOC
          toc={tableOfContents}
          activeId={activeId}
          onSelect={handleTOCSelect}
          moduleCode={module.moduleCode}
          moduleTitle={module.title}
          tier={tier}
        />
      );
    }

    // Fallback to curriculum-based sidebar
    return (
      <StudentModuleSidebar
        module={{
          moduleCode: module.moduleCode,
          title: module.title,
          tier,
        }}
        outcomes={outcomes}
        activeOIdx={activeOIdx}
        activeICIdx={activeICIdx}
        activeTopicIdx={activeTopicIdx}
        activeItemIdx={activeItemIdx}
        livePct={livePct}
        completedCount={completedCount}
        totalBlocks={totalBlocks}
        onNavigate={navigate}
        outcomePct={outcomePct}
        topicPct={topicPct}
      />
    );
  }, [tableOfContents, handleTOCSelect, activeOIdx, activeICIdx, activeTopicIdx, activeItemIdx, livePct, completedCount, outcomes, totalBlocks]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-slate-950 text-white flex flex-col overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

      {celebrating && <Celebration xp={module.xpReward} name={userName} />}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 overflow-y-auto p-3 z-30 shadow-2xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Contents</p>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white rounded p-0.5 transition"><X className="w-4 h-4" /></button>
            </div>
            {sidebarComponent}
          </div>
        </div>
      )}

      {/* ── Sticky progress ribbon ── */}
      <div className="shrink-0 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
        {/* Progress bar */}
        <div className="h-[3px] flex overflow-hidden">
          <div className="flex-1 bg-slate-800">
            <div className={`h-full bg-gradient-to-r ${tierGrad} transition-all duration-700`} style={{ width: `${livePct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Link href="/passport" className="shrink-0 flex items-center gap-1 text-sm text-slate-400 hover:text-white transition font-medium"><ArrowLeft className="w-3.5 h-3.5" /> Passport</Link>
          <button onClick={() => setSidebarOpen(true)} className="md:hidden shrink-0 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-2 py-1">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className={`text-xs font-bold truncate ${tierAccent}`}>{module.moduleCode} · {module.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden md:block">
              <div className={`h-full rounded-full bg-gradient-to-r ${tierGrad} transition-all duration-700`} style={{ width: `${livePct}%` }} />
            </div>
            <span className={`text-xs font-extrabold ${tierAccent}`}>{livePct}%</span>
          </div>
          <span className={`shrink-0 hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusColor}`}>
            {statusLabel}
          </span>
          <StudentQuizResults />
          <QuizGradeNotifications />
          {loadingLive && <span className="text-xs text-slate-600 animate-pulse shrink-0">loading…</span>}
        </div>
      </div>

      {/* ── Two-panel layout — sidebar always visible on md+ ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR — always visible md+, slide-in on mobile ── */}
        <aside className={`
          absolute md:static inset-y-0 left-0 z-10 w-72 shrink-0
          bg-slate-950 border-r border-slate-800/60
          flex flex-col overflow-hidden
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          md:translate-x-0
        `}>
          {/* Sidebar header strip */}
          <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contents</h2>
              <span className="text-[10px] text-slate-600 font-mono">{outcomes.length} outcomes</span>
            </div>
          </div>
          {/* Scrollable TOC - preserve scroll position with stable ref and prevent auto-scroll on focus */}
          <div
            ref={sidebarRef}
            className="flex-1 overflow-y-auto"
            style={{
              scrollBehavior: 'auto',
              overflowAnchor: 'none'  // Prevent scroll anchoring
            }}
          >
            {sidebarComponent}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div ref={mainRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="px-5 lg:px-10 py-8 space-y-6">

            {/* Live update banner */}
            {hasUpdate && <LiveUpdateBanner onReload={applyUpdate} />}

            {/* ── Breadcrumb ── */}
            <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className={`font-extrabold ${tierAccent}`}>{module.moduleCode}</span>
              <span>›</span><span>LO {activeOutcome.number}</span>
              <span>›</span><span className="text-slate-500 truncate max-w-[120px]">{activeIC.title}</span>
              <span>›</span><span className="text-slate-300 font-medium truncate max-w-[160px]">{activeTopic.title}</span>
              {activeItemIdx !== undefined && activeTopic.items && activeTopic.items[activeItemIdx] && (
                <>
                  <span>›</span>
                  <span className="text-yellow-300 font-semibold truncate max-w-[200px]">{activeTopic.items[activeItemIdx]}</span>
                </>
              )}
            </nav>

            {/* ── Item Display (when item is selected) ── */}
            {activeItemIdx !== undefined && activeTopic.items && activeTopic.items[activeItemIdx] && (
              <div className="rounded-3xl bg-gradient-to-br from-yellow-500 to-amber-600 p-0.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="rounded-[22px] bg-slate-950 p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-yellow-400 mt-1 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-yellow-400">
                          Item {activeItemIdx + 1} of {activeTopic.items.length}
                        </span>
                        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-bold text-yellow-300">
                          Selected
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-yellow-50 leading-snug">
                        {activeTopic.items[activeItemIdx]}
                      </h2>
                      <p className="text-sm text-slate-400">
                        Topic: <span className="text-slate-300 font-semibold">{activeTopic.title}</span>
                      </p>
                    </div>
                  </div>

                  {/* Clear selection button */}
                  <div className="pt-3 mt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => setActiveItemIdx(undefined)}
                      className="text-xs text-slate-400 hover:text-yellow-300 transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>View all topic items</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Topic hero card ── Only show when NO item is selected */}
            {activeItemIdx === undefined && (
              <div className={`rounded-3xl bg-gradient-to-br ${tierGrad} p-0.5 shadow-2xl`}>
                <div className="rounded-[22px] bg-slate-950 p-6 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-extrabold uppercase tracking-widest ${tierAccent}`}>
                          LO {activeOutcome.number} · {activeIC.title}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                      </div>
                      <h1 className="text-2xl font-black text-white leading-snug">{activeTopic.title}</h1>
                      {activeTopic.description && <p className="text-sm text-slate-400">{activeTopic.description}</p>}
                    </div>
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <ProgressRing pct={topicPct(activeTopic)} size={64} tier={tier} />
                      <p className="text-[10px] text-slate-500 text-center">
                        {activeBlocks.filter(b => doneBlocks.has(b.id)).length}/{activeBlocks.length} done
                      </p>
                    </div>
                  </div>
                  {/* LO progress strip */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800/60">
                    <ProgressRing pct={outcomePct(activeOutcome)} size={28} tier={tier} />
                    <div className="flex-1 text-xs text-slate-500">
                      <span className="text-white font-semibold">LO {activeOutcome.number}:</span> {activeOutcome.title}
                      <span className="ml-2 text-slate-600">· {activeOutcome.learningHours}h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Activity blocks ── */}
            <div className="space-y-5">
              {activeBlocks.length === 0 ? (
                <div className={`rounded-2xl border ${tierBorder} bg-slate-900/40 p-8 text-center space-y-2`}>
                  <div className="flex justify-center"><BookOpen className="w-10 h-10 text-slate-600" /></div>
                  {activeItemIdx !== undefined ? (
                    <>
                      <p className="text-slate-400 font-medium">No content for this item yet</p>
                      <p className="text-slate-600 text-sm">Your trainer hasn't added content to this specific item.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-400 font-medium">Content coming soon</p>
                      <p className="text-slate-600 text-sm">Your trainer is preparing content for this topic.</p>
                    </>
                  )}
                </div>
              ) : (
                activeBlocks.map((block, i) => (
                  <div key={block.id} className="relative">
                    {doneBlocks.has(block.id) && (
                      <div className="absolute -left-3 top-3 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                    <div className={`transition-all duration-500`} style={{ transitionDelay: `${Math.min(i * 80, 400)}ms` }}>
                      <BlockView block={block} done={doneBlocks.has(block.id)} onDone={() => markDone(block.id)} tier={tier} nodeId={nodeId ?? undefined} userName={userName} trackId={propTrackId ?? undefined} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Navigation ── Only show topic navigation when NO item is selected */}
            {activeItemIdx === undefined && (
              <div className="flex items-center justify-between pt-4 gap-3">
                <button disabled={isFirst} onClick={goPrev}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-25 transition">
                  <ArrowLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs text-slate-600 text-center">
                  {activeTopicIdx + 1} / {activeIC.topics.length}
                </span>
                <button disabled={isLast} onClick={goNext}
                  className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r ${tierGrad} px-5 py-2.5 text-sm font-bold text-white disabled:opacity-25 transition hover:shadow-lg hover:scale-105 disabled:scale-100`}>
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Item info ── Show when an item is selected */}
            {activeItemIdx !== undefined && activeTopic.items && activeTopic.items[activeItemIdx] && (
              <div className="pt-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-5 py-3">
                  <p className="text-xs text-slate-500 mb-1">Currently viewing:</p>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                    {activeTopic.items[activeItemIdx]}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Item {activeItemIdx + 1} of {activeTopic.items.length} in this topic
                  </p>
                </div>
              </div>
            )}

            {/* ── Completion + evidence ── */}
            {livePct >= 100 && status !== "verified" && (
              <div className={`rounded-2xl border ${tierBorder} bg-slate-900/60 p-6 space-y-4`}>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-white shrink-0" />
                  <div>
                    <p className="font-extrabold text-white">All topics completed!</p>
                    <p className="text-sm text-slate-400 mt-0.5">Submit evidence to claim <strong className={tierAccent}>+{module.xpReward} XP</strong></p>
                  </div>
                </div>
                {submitted ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-400 font-bold"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitted — awaiting trainer verification</p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="url" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
                      placeholder="GitHub repo / project link (optional)"
                      className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none" />
                    <button onClick={submitEvidence}
                      className={`rounded-2xl bg-gradient-to-r ${tierGrad} px-6 py-3 text-sm font-bold text-white shadow hover:shadow-lg hover:scale-105 transition`}>
                      Submit for verification
                    </button>
                  </div>
                )}
              </div>
            )}

            {status === "verified" && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-2">
                <div className="flex justify-center"><CheckCircle2 className="w-12 h-12 text-emerald-300" /></div>
                <p className="text-xl font-extrabold text-emerald-300">Skill Verified!</p>
                <p className="text-sm text-slate-400">Outstanding work, {userName}. This skill is stamped in your passport.</p>
              </div>
            )}

            {/* ── Footer links ── */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800/60 pb-8">
              <Link href="/passport" className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition">
                <ArrowLeft className="w-3.5 h-3.5" /> Passport
              </Link>
              <Link href="/progress" className={`inline-flex items-center gap-1.5 rounded-2xl border ${tierBorder} bg-slate-900 px-4 py-2 text-sm font-bold ${tierAccent} hover:bg-slate-800 transition`}>
                My Progress <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
