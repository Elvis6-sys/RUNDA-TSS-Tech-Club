"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { ProgressRing, ProgressPill, ProgressSteps, StatusBadge, type ProgressStatus } from "./ProgressRing";

// ─── Types ────────────────────────────────────────────────────────────────────

type CurriculumModule = { id: string; title: string; file: string; fileUrl: string };
type CurriculumTrack = { id: string; name: string; modules: CurriculumModule[] };
type CurriculumLevel = { id: string; title: string; tracks: CurriculumTrack[] };
type Profile = { xp: number; role: string; name: string | null; cohort: string | null; level: string | null };

type ModuleProg = { readPct: number; status: ProgressStatus; nodeId: string | null };

// ─── XP helpers ───────────────────────────────────────────────────────────────

function xpLevel(xp: number) {
  const T = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];
  let lvl = 0;
  for (let i = 0; i < T.length; i++) if (xp >= T[i]) lvl = i + 1;
  const current = T[Math.min(lvl - 1, T.length - 1)];
  const next = T[Math.min(lvl, T.length - 1)];
  const pct = next > current ? Math.round(((xp - current) / (next - current)) * 100) : 100;
  return { level: lvl, label: `Rank ${lvl}`, next, current, pct };
}

// ─── Progress fetcher ─────────────────────────────────────────────────────────

function usePassportProgress(allModuleIds: string[]) {
  const [prog, setProg] = useState<Record<string, ModuleProg>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allModuleIds.length) { setLoading(false); return; }
    const ids = allModuleIds.join(",");
    fetch(`/api/passport/progress/bulk?ids=${encodeURIComponent(ids)}`)
      .then(r => r.ok ? r.json() : {})
      .then(data => { setProg(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [allModuleIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Fire-and-forget: record that the student opened a module */
  const trackOpen = useCallback((nodeId: string | null) => {
    if (!nodeId) return;
    fetch("/api/passport/progress/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId, action: "open" }),
    }).then(r => r.ok ? r.json() : null)
      .then(updated => {
        if (!updated) return;
        setProg(prev => ({
          ...prev,
          [nodeId]: { readPct: updated.readPct, status: updated.status as ProgressStatus, nodeId },
        }));
      })
      .catch(() => { });
  }, []);

  return { prog, loading, trackOpen };
}

// ─── Track summary bar ────────────────────────────────────────────────────────

function TrackSummaryBar({
  modules,
  prog,
}: {
  modules: CurriculumModule[];
  prog: Record<string, ModuleProg>;
}) {
  const started = modules.filter(m => prog[m.id]?.readPct > 0).length;
  const completed = modules.filter(m => (prog[m.id]?.readPct ?? 0) >= 100 || prog[m.id]?.status === "done" || prog[m.id]?.status === "verified").length;
  const pct = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-[9px] text-slate-500">
        <span>{completed}/{modules.length} done · {started} started</span>
        <span className="font-bold text-white">{pct}%</span>
      </div>
      <ProgressPill pct={pct} height={4} showLabel={false} />
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({
  module,
  prog,
  onOpen,
}: {
  module: CurriculumModule;
  prog: ModuleProg | undefined;
  onOpen: (nodeId: string | null) => void;
}) {
  const readPct = prog?.readPct ?? 0;
  const status = (prog?.status ?? "not_started") as ProgressStatus;
  const nodeId = prog?.nodeId ?? null;
  const hasStart = readPct > 0 || status !== "not_started";

  // Intersection Observer — fires "open" once when card enters viewport
  const ref = useRef<HTMLElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !nodeId) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !fired.current) {
        fired.current = true;
        // Only record if not yet started to avoid spamming
        if (readPct === 0) onOpen(nodeId);
      }
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [nodeId, readPct, onOpen]);

  return (
    <article
      ref={ref}
      className="group relative rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-600 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle glow when has progress */}
      {hasStart && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-20"
          style={{ background: `radial-gradient(ellipse at top left, ${status === "verified" ? "#34d399" : status === "done" ? "#38bdf8" : "#fbbf24"} 0%, transparent 70%)` }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-white leading-snug group-hover:text-slate-300 transition-colors line-clamp-2">
            {module.title}
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500 truncate">{module.file}</p>

          {/* Status badge */}
          <div className="mt-1.5">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Progress ring */}
        <ProgressRing
          pct={readPct}
          size={40}
          stroke={3}
          uid={`mod-${module.id}`}
          status={status}
          showPct={readPct > 0}
          className="shrink-0"
        />
      </div>

      {/* Progress pill */}
      {readPct > 0 && (
        <div className="mt-2">
          <ProgressPill pct={readPct} height={3} showLabel={false} />
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <a
          href={module.fileUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => onOpen(nodeId)}
          className="rounded-lg border border-sky-500 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/20 transition"
        >
          📖 Open PDF
        </a>
        <a
          href={module.fileUrl}
          download
          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300 hover:border-slate-600 transition"
        >
          ⬇️ Download
        </a>
        {/* Study button - show if module has a slug (interactive content available) */}
        {module.file && (
          <Link
            href={`/learn/${module.file}`}
            onClick={() => onOpen(nodeId)}
            className="rounded-lg border border-emerald-500 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            📚 Study →
          </Link>
        )}
      </div>

      {/* Only show "coming soon" if no interactive content yet */}
      {!module.file && (
        <div className="mt-2 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-300 text-center">
          💡 Interactive content coming soon - Read PDF for now
        </div>
      )}
    </article>
  );
}

// ─── Level summary ring ───────────────────────────────────────────────────────

function LevelRing({ level, prog }: { level: CurriculumLevel; prog: Record<string, ModuleProg> }) {
  const allMods = level.tracks.flatMap(t => t.modules);
  const completed = allMods.filter(m => (prog[m.id]?.readPct ?? 0) >= 100 || ["done", "verified"].includes(prog[m.id]?.status ?? "")).length;
  const pct = allMods.length > 0 ? Math.round((completed / allMods.length) * 100) : 0;
  return (
    <ProgressRing
      pct={pct}
      size={36}
      stroke={3}
      uid={`level-${level.id}`}
      showPct
      className="shrink-0"
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PassportClient({
  profile,
  levels,
  verifiedCount,
  totalNodes,
}: {
  profile: Profile;
  levels: CurriculumLevel[];
  verifiedCount: number;
  totalNodes: number;
}) {
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");

  const level = levels.find(l => l.id === selectedLevel) ?? null;
  const track = level?.tracks.find(t => t.id === selectedTrack) ?? null;

  useEffect(() => {
    if (!selectedLevel) { setSelectedTrack(""); return; }
    setSelectedTrack(level?.tracks[0]?.id ?? "");
  }, [selectedLevel, level]);

  // Collect all module IDs once
  const allModuleIds = levels.flatMap(l => l.tracks.flatMap(t => t.modules.map(m => m.id)));
  const { prog, loading, trackOpen } = usePassportProgress(allModuleIds);

  const xpInfo = xpLevel(profile.xp);

  // Overall counts
  const totalStarted = allModuleIds.filter(id => prog[id]?.readPct > 0).length;
  const totalCompleted = allModuleIds.filter(id => (prog[id]?.readPct ?? 0) >= 100 || ["done", "verified"].includes(prog[id]?.status ?? "")).length;
  const overallPct = totalNodes > 0 ? Math.round((totalCompleted / totalNodes) * 100) : 0;

  return (
    <div className="space-y-5">

      {/* ── Hero card ── */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-700/50 backdrop-blur-xl bg-gradient-to-br from-slate-800/60 to-slate-900/40 p-5 shadow-xl">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-cyan-500/5" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Profile Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                </span>
                <span className="text-[9px] font-medium text-sky-300 uppercase tracking-wider">Passport</span>
              </div>
            </div>

            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight">
                {profile.name ?? "Student"}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/50 text-[10px] font-medium text-slate-300">
                  {profile.level ?? profile.role.toUpperCase()}
                </span>
                {profile.cohort && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/50 text-[10px] text-slate-400">
                    Cohort {profile.cohort}
                  </span>
                )}
              </div>
            </div>

            {/* XP Progress - Compact */}
            <div className="rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <span className="text-sm">⚡</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{xpInfo.label}</p>
                    <p className="text-[9px] text-slate-400">{profile.xp} XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-sky-400">{xpInfo.next - profile.xp}</p>
                  <p className="text-[8px] text-slate-500">to next</p>
                </div>
              </div>

              <ProgressPill pct={xpInfo.pct} scheme="sky" height={5} showLabel={false} />
            </div>
          </div>

          {/* Right: Overall Progress Ring - Compact */}
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm px-5 py-3 text-center lg:min-w-[140px]">
            <ProgressRing
              pct={overallPct}
              size={60}
              stroke={5}
              uid="passport-hero"
              showPct
              className="drop-shadow-lg"
            />
            <div>
              <p className="text-[10px] font-bold text-white">Overall</p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                {totalCompleted}/{totalNodes}
              </p>
            </div>
            <div className="flex gap-3 text-center pt-1 border-t border-slate-700/50 w-full">
              <div>
                <p className="text-xs font-bold text-emerald-400">{totalCompleted}</p>
                <p className="text-[8px] text-slate-500">Done</p>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400">{totalStarted}</p>
                <p className="text-[8px] text-slate-500">Started</p>
              </div>
            </div>
            {loading && (
              <div className="flex items-center gap-1 text-[9px] text-slate-500">
                <div className="w-2 h-2 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin" />
                Loading
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Level picker ── */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-4 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎓</span>
              <h2 className="text-base font-bold text-white">Choose Level</h2>
            </div>
            <p className="text-[10px] text-slate-400">Select curriculum level to explore modules</p>
          </div>
          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
            className="min-w-[200px] rounded-lg border border-slate-700 bg-slate-900/60 backdrop-blur-sm px-4 py-2.5 text-xs font-medium text-slate-100 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 transition cursor-pointer hover:border-slate-600"
          >
            <option value="">Select a level…</option>
            {levels.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
      </section>

      {!selectedLevel && (
        <section className="rounded-2xl border border-dashed border-slate-700/50 bg-slate-900/30 backdrop-blur-xl p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700/50 mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Select a Level</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Choose your curriculum level above to view folders and modules.
          </p>
        </section>
      )}

      {/* ── Folder grid ── */}
      {selectedLevel && level && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-1 rounded-full bg-slate-500 animate-pulse" />
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{level.title}</p>
              </div>
              <h2 className="text-xl font-bold text-white">Folders</h2>
            </div>
            <div className="flex items-center gap-3">
              <LevelRing level={level} prog={prog} />
              <span className="px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-[10px] font-medium text-slate-300">
                {level.tracks.length} folders
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {level.tracks.map(folder => {
              const folderCompleted = folder.modules.filter(m =>
                (prog[m.id]?.readPct ?? 0) >= 100 || ["done", "verified"].includes(prog[m.id]?.status ?? "")
              ).length;
              const folderPct = folder.modules.length > 0 ? Math.round((folderCompleted / folder.modules.length) * 100) : 0;

              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedTrack(folder.id)}
                  className={`group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 text-left
                    ${selectedTrack === folder.id
                      ? "border-slate-600 bg-slate-700/10 shadow-xl shadow-slate-500/20 scale-[1.02]"
                      : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60"
                    }`}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 transition-opacity duration-300 ${selectedTrack === folder.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} bg-gradient-to-br from-slate-700/5 to-slate-800/5`} />

                  {/* Content */}
                  <div className="relative p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-bold transition-colors ${selectedTrack === folder.id ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                        {folder.name}
                      </h3>
                      <ProgressRing pct={folderPct} size={36} stroke={3} uid={`folder-${folder.id}`} showPct />
                    </div>

                    <TrackSummaryBar modules={folder.modules} prog={prog} />

                    <div className="pt-1.5 border-t border-slate-700/50">
                      <ProgressSteps
                        total={folder.modules.length}
                        completed={folderCompleted}
                        size={5}
                        className="mb-1"
                      />
                      <p className="text-[9px] text-slate-500">
                        {folderCompleted}/{folder.modules.length} modules
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Module cards ── */}
      {selectedTrack && track && (
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-xl p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📚</span>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{level?.title}</p>
              </div>
              <h2 className="text-lg font-bold text-white">{track.name}</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Track-level progress ring */}
              {(() => {
                const done = track.modules.filter(m =>
                  (prog[m.id]?.readPct ?? 0) >= 100 || ["done", "verified"].includes(prog[m.id]?.status ?? "")
                ).length;
                const pct = track.modules.length > 0 ? Math.round((done / track.modules.length) * 100) : 0;
                return <ProgressRing pct={pct} size={40} stroke={4} uid={`track-${track.id}`} showPct />;
              })()}
              <button
                onClick={() => setSelectedTrack("")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 backdrop-blur-sm px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {track.modules.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                prog={prog[module.id]}
                onOpen={trackOpen}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
