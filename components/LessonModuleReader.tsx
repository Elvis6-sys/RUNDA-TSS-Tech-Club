"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";

type Props = {
  node: {
    id: string;
    title: string;
    description: string | null;
    xpReward: number;
    estimatedMinutes: number;
    track: { id: string; name: string; icon: string | null };
    progress: {
      status: string;
      readPct: number;
      verifiedAt: string | null;
      evidenceUrl: string | null;
    } | null;
  };
  lesson: { id: string; title: string; subject: string; content: string } | null;
  userId: string;
};

// ─── Minimal markdown renderer ────────────────────────────────────────────────
function renderContent(raw: string): string {
  return raw
    .replace(/^#{3} (.+)$/gm, '<h3 class="text-base font-bold text-white mt-8 mb-2 tracking-wide">$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2 class="text-lg font-bold text-sky-300 mt-10 mb-3 border-b border-slate-800 pb-2">$1</h2>')
    .replace(/^#{1} (.+)$/gm, '<h1 class="text-xl font-black text-white mt-10 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code class="rounded bg-slate-800 px-1.5 py-0.5 text-sky-300 text-sm font-mono">$1</code>')
    .replace(/^─{3,}$/gm, '<hr class="border-slate-800 my-6" />')
    .replace(/^={3,}$/gm, '<hr class="border-slate-700 my-4" />')
    // Code blocks (indented 2+ spaces or lines that look like code)
    .replace(/((?:^  .+\n?)+)/gm, (match) =>
      `<pre class="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4 font-mono text-sm text-emerald-300 overflow-x-auto my-4 leading-relaxed whitespace-pre">${match.replace(/^  /gm, "")}</pre>`
    )
    .replace(/\n/g, "<br />");
}

// Split content into sections by top-level headings or every ~600 chars
function splitSections(content: string): string[] {
  const lines = content.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if ((line.startsWith("─") || line.startsWith("=")) && current.length > 10) {
      sections.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) sections.push(current.join("\n"));
  return sections.filter((s) => s.trim().length > 0);
}

export default function LessonModuleReader({ node, lesson, userId }: Props) {
  const [readPct, setReadPct] = useState(node.progress?.readPct ?? 0);
  const [status, setStatus] = useState(node.progress?.status ?? "studying");
  const [celebrating, setCelebrating] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState(node.progress?.evidenceUrl ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [, startTransition] = useTransition();
  const celebrationFired = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastSavedPct = useRef(readPct);

  const sections = lesson ? splitSections(lesson.content) : [];
  const totalSections = sections.length || 1;

  // Save progress to server
  function saveProgress(pct: number, newStatus?: string) {
    if (Math.abs(pct - lastSavedPct.current) < 5 && !newStatus) return; // debounce small changes
    lastSavedPct.current = pct;
    startTransition(async () => {
      await fetch(`/api/modules/${node.id}/lesson-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readPct: pct, status: newStatus ?? status }),
      });
    });
  }

  // Track scroll progress within the content area
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      if (total <= 0) return;
      const pct = Math.round((scrolled / total) * 100);
      const newPct = Math.max(readPct, pct); // never go backwards
      setReadPct(newPct);
      saveProgress(newPct);

      if (newPct >= 95 && !celebrationFired.current) {
        celebrationFired.current = true;
        setCelebrating(true);
        setStatus("done");
        saveProgress(100, "done");
        setTimeout(() => setCelebrating(false), 4000);
      }
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, readPct]);

  function goSection(i: number) {
    setActiveSection(i);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    const pct = Math.max(readPct, Math.round((i / totalSections) * 100));
    setReadPct(pct);
    saveProgress(pct);
  }

  function submitEvidence() {
    startTransition(async () => {
      await fetch("/api/passport/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, status: "done", evidenceUrl }),
      });
      setSubmitted(true);
      setStatus("done");
    });
  }

  const currentSection = sections[activeSection] ?? lesson?.content ?? "";

  return (
    <div className="flex flex-col bg-slate-950" style={{ height: "calc(100vh - 56px)" }}>

      {/* Celebration overlay */}
      {celebrating && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce text-center">
            <p className="text-6xl">🎉</p>
            <p className="mt-3 text-2xl font-black text-white drop-shadow-lg">Lesson Complete!</p>
            <p className="text-emerald-400 font-semibold">+{node.xpReward} XP incoming</p>
          </div>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-2 w-2 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ["#38bdf8","#34d399","#fbbf24","#f472b6","#a78bfa"][i % 5],
                animationDelay: `${Math.random()}s`,
                animationDuration: `${0.6 + Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Sticky header + progress bar ── */}
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/passport" className="shrink-0 text-sm text-slate-400 hover:text-white transition">
            ← {node.track.icon} {node.track.name}
          </Link>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${readPct}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-bold text-slate-400">{readPct}%</span>
        </div>

        {/* Section tabs — only show if multiple sections */}
        {sections.length > 1 && (
          <div className="flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
            {sections.map((_, i) => (
              <button
                key={i}
                onClick={() => goSection(i)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  i === activeSection
                    ? "bg-sky-500 text-slate-950"
                    : i < activeSection
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-500 hover:text-slate-300"
                }`}
              >
                {i < activeSection ? "✓" : i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Two-column layout: sidebar + content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — module info */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-4 border-r border-slate-800 bg-slate-900/40 px-5 py-6 overflow-y-auto">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Module</p>
            <h2 className="text-sm font-bold text-white leading-snug">{node.title}</h2>
            {node.description && <p className="mt-1 text-xs text-slate-500">{node.description}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>⏱</span><span>~{node.estimatedMinutes} min</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span>⚡</span><span>+{node.xpReward} XP on completion</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              status === "verified" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" :
              status === "done"     ? "border-sky-500/50 bg-sky-500/10 text-sky-300" :
              "border-amber-500/50 bg-amber-500/10 text-amber-300"
            }`}>
              {status === "verified" ? "✦ Verified" : status === "done" ? "◉ Done" : "◎ In progress"}
            </div>
          </div>

          {/* XP ring */}
          <div className="mt-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Reading progress</p>
            <div className="relative h-16 w-16">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke="url(#lmg)" strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 - (2 * Math.PI * 26 * readPct) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="lmg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-sky-400">{readPct}%</span>
              </div>
            </div>
          </div>

          {/* Section list */}
          {sections.length > 1 && (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Sections</p>
              {sections.map((s, i) => {
                const heading = s.split("\n").find((l) => l.trim().length > 0) ?? `Section ${i + 1}`;
                const label = heading.replace(/^[#─=\s]+/, "").slice(0, 36);
                return (
                  <button
                    key={i}
                    onClick={() => goSection(i)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs transition ${
                      i === activeSection
                        ? "bg-sky-500/15 text-sky-300 font-semibold"
                        : i < activeSection
                        ? "text-emerald-400 hover:bg-slate-800"
                        : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                    }`}
                  >
                    {i < activeSection ? "✓ " : `${i + 1}. `}{label}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Main content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-8 pb-32">

            {/* Module header */}
            <div className="mb-8 space-y-2">
              {lesson && (
                <span className="inline-flex items-center rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-400">
                  {lesson.subject}
                </span>
              )}
              <h1 className="text-2xl font-black text-white leading-tight">{node.title}</h1>
              {node.description && <p className="text-slate-400 text-sm">{node.description}</p>}
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span>⏱ ~{node.estimatedMinutes} min</span>
                <span>⚡ +{node.xpReward} XP</span>
                {sections.length > 1 && <span>📄 {sections.length} sections</span>}
              </div>
            </div>

            {/* No lesson content fallback */}
            {!lesson ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                <p className="text-4xl mb-3">📝</p>
                <p className="font-semibold text-slate-400">Content coming soon</p>
                <p className="text-sm mt-1">This module&apos;s material is being prepared.</p>
              </div>
            ) : (
              <>
                {/* Section navigation hint */}
                {sections.length > 1 && (
                  <div className="mb-6 flex items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 py-3 text-xs text-slate-400">
                    <span>📖</span>
                    <span>Section {activeSection + 1} of {sections.length}</span>
                    <span className="ml-auto text-slate-600">Scroll to read · progress saves automatically</span>
                  </div>
                )}

                {/* Lesson content */}
                <div
                  className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-[15px]"
                  dangerouslySetInnerHTML={{ __html: renderContent(currentSection) }}
                />

                {/* Section navigation buttons */}
                {sections.length > 1 && (
                  <div className="mt-10 flex items-center justify-between gap-3">
                    <button
                      onClick={() => goSection(Math.max(0, activeSection - 1))}
                      disabled={activeSection === 0}
                      className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-30"
                    >
                      ← Previous
                    </button>
                    {activeSection < sections.length - 1 ? (
                      <button
                        onClick={() => goSection(activeSection + 1)}
                        className="rounded-2xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition"
                      >
                        Next section →
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setReadPct(100);
                          setStatus("done");
                          saveProgress(100, "done");
                          if (!celebrationFired.current) {
                            celebrationFired.current = true;
                            setCelebrating(true);
                            setTimeout(() => setCelebrating(false), 4000);
                          }
                        }}
                        className="rounded-2xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
                      >
                        ✓ Mark complete
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Completion CTA ── */}
            {readPct >= 95 && status !== "verified" && (
              <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4">
                <p className="text-lg font-bold text-white">🎓 You&apos;ve read this module!</p>
                <p className="text-sm text-slate-400">
                  Add an evidence link (GitHub, project, notes) and submit for verification to earn{" "}
                  <strong className="text-emerald-400">+{node.xpReward} XP</strong>.
                </p>
                {submitted ? (
                  <p className="text-sm text-emerald-400 font-semibold">⏳ Submitted — awaiting verification by a teacher or L5</p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="GitHub / project link (optional)"
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={submitEvidence}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition"
                    >
                      Submit for verification
                    </button>
                  </div>
                )}
              </div>
            )}

            {status === "verified" && (
              <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
                <p className="text-3xl mb-2">✦</p>
                <p className="text-lg font-bold text-emerald-300">Skill Verified!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Verified {node.progress?.verifiedAt ? new Date(node.progress.verifiedAt).toLocaleDateString() : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
