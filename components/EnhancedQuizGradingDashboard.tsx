"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Circle, Scale, Edit3, Link2, BarChart3, CheckSquare,
  MessageSquare, FileText, Code2, Paperclip, Palette,
  Mic, Video, AlertTriangle, Zap, RefreshCw, Check, Sparkles,
  Bell, BellRing, X,
} from "lucide-react";
import MODULES from "@/lib/learnContent";
import AIGradingPanel from "./AIGradingPanel";
import BulkAIGradingModal from "./BulkAIGradingModal";
import ExamPinManager from "./ExamPinManager";

// ─── Types ────────────────────────────────────────────────────────────────────

type Submission = {
  id: string;
  userId: string;
  nodeId: string;
  blockId: string;
  status: string;
  totalQuestions: number;
  gradedCount: number;
  avgScore: number | null;
  autoSubmitted: boolean;
  cheatAttempts: number;
  marksReleased: boolean;
  marksReleasedAt: string | null;
  user: { id: string; name: string | null; email: string };
  node: { id: string; title: string; blocks: any };
  createdAt: string;
  updatedAt: string;
};

type Response = {
  id: string;
  questionIdx: number;
  questionType: string;
  answerChoice: number | null;
  answerText: string | null;
  fileUrl: string | null;
  gradeScore: number | null;
  gradeNotes: string | null;
  autoGraded: boolean;
  autoScore: number | null;
  manualOverride: boolean;
  gradedAt: string | null;
};

const QT_LABELS: Record<string, string> = {
  mcq: "Multiple Choice", truefalse: "True/False", fillin: "Fill-in-blank",
  matching: "Matching", ordering: "Ordering", multiselect: "Multi-select",
  short: "Short Answer", essay: "Essay", coding: "Code", file_upload: "File Upload",
  drawing: "Drawing", audio: "Audio", video: "Video",
};

const QT_ICONS: Record<string, JSX.Element> = {
  mcq: <Circle className="w-4 h-4" />,
  truefalse: <Scale className="w-4 h-4" />,
  fillin: <Edit3 className="w-4 h-4" />,
  matching: <Link2 className="w-4 h-4" />,
  ordering: <BarChart3 className="w-4 h-4" />,
  multiselect: <CheckSquare className="w-4 h-4" />,
  short: <MessageSquare className="w-4 h-4" />,
  essay: <FileText className="w-4 h-4" />,
  coding: <Code2 className="w-4 h-4" />,
  file_upload: <Paperclip className="w-4 h-4" />,
  drawing: <Palette className="w-4 h-4" />,
  audio: <Mic className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
};

// ─── Main dashboard component ─────────────────────────────────────────────────

type NewSub = { id: string; studentName: string; quizTitle: string; arrivedAt: string };

export default function EnhancedQuizGradingDashboard({ trackId }: { trackId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "graded" | "released">("all");
  const [sortBy, setSortBy] = useState<"recent" | "score" | "name">("recent");
  const [releasing, setReleasing] = useState<string | null>(null); // submissionId being released
  const [showPinManager, setShowPinManager] = useState(false); // WEEK 3: Show/hide PIN manager

  // ── New-submission notification state ─────────────────────────────────────
  const [newSubmissionToasts, setNewSubmissionToasts] = useState<NewSub[]>([]);
  const [newCount, setNewCount] = useState(0);
  // ISO timestamp of the most recent submission seen — used as the `since` cursor
  const lastSeenAt = useRef<string>(new Date().toISOString());

  // Dismiss a single toast by id
  const dismissToast = (id: string) =>
    setNewSubmissionToasts(prev => prev.filter(t => t.id !== id));

  // Ref so poll callbacks always read latest selectedSub without stale closure
  const selectedSubRef = useRef<Submission | null>(null);
  selectedSubRef.current = selectedSub;

  const load = useCallback(async (background = false) => {
    // Background polls never show the loading spinner — that would re-render
    // and kick the teacher out of the grading view mid-session
    if (!background) { setLoading(true); setError(null); }
    try {
      const res = await fetch(`/api/quiz/grade?trackId=${encodeURIComponent(trackId)}`);
      const data = await res.json();
      if (!res.ok) {
        if (!background) setError(`${res.status}: ${data.error ?? "Unknown"}`);
      } else {
        const fresh: Submission[] = data.submissions || [];
        setSubmissions(fresh);
        // Re-sync the open submission by ID so the grading view stays open
        // with refreshed data (e.g. updated gradedCount after auto-grading)
        if (selectedSubRef.current) {
          const updated = fresh.find(s => s.id === selectedSubRef.current!.id);
          if (updated) setSelectedSub(updated);
        }
      }
    } catch (e) {
      if (!background) setError(String(e));
    } finally {
      if (!background) setLoading(false);
    }
  }, [trackId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (expanded) load(); }, [expanded, load]);

  // Background poll — update counts even when collapsed
  useEffect(() => {
    const delay = selectedSub ? 90000 : expanded ? 30000 : 10000; // 10s when collapsed for badge updates
    const interval = setInterval(() => load(true), delay);
    return () => clearInterval(interval);
  }, [expanded, selectedSub, load]);

  // ── New-submission poll — checks /api/quiz/teacher-submissions?since=... ──
  // Runs every 15 seconds regardless of expanded state so the teacher always
  // gets notified even while editing the module content.
  useEffect(() => {
    async function pollNewSubmissions() {
      try {
        const url = `/api/quiz/teacher-submissions?trackId=${encodeURIComponent(trackId)}&since=${encodeURIComponent(lastSeenAt.current)}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const fresh: any[] = data.submissions ?? [];
        const incoming = fresh.filter((s: any) => s.isNew);
        if (incoming.length === 0) return;

        // Update the cursor to the newest we just saw
        const newest = incoming.reduce((max: string, s: any) =>
          s.createdAt > max ? s.createdAt : max,
          lastSeenAt.current
        );
        lastSeenAt.current = newest;

        // Add toasts (cap at 5 visible at once)
        const toasts: NewSub[] = incoming.map((s: any) => ({
          id: s.id,
          studentName: s.student?.name ?? "A student",
          quizTitle: s.nodeTitle ?? "a quiz",
          arrivedAt: s.createdAt,
        }));
        setNewSubmissionToasts(prev => [...toasts, ...prev].slice(0, 5));
        setNewCount(prev => prev + incoming.length);

        // Also reload the full list so the grading table picks up new rows
        load(true);

        // Auto-dismiss toasts after 8 seconds
        setTimeout(() => {
          setNewSubmissionToasts(prev =>
            prev.filter(t => !toasts.some(nt => nt.id === t.id))
          );
        }, 8000);
      } catch {
        // Non-fatal — silent fail
      }
    }

    const interval = setInterval(pollNewSubmissions, 15000);
    return () => clearInterval(interval);
  }, [trackId, load]);

  // ── Release helpers ───────────────────────────────────────────────────────
  async function releaseMarks(ids: string[], unreleased = false) {
    console.log('[FRONTEND releaseMarks] Called with:', { ids, unreleased, trackId });
    if (ids.length === 0) {
      console.log('[FRONTEND releaseMarks] No IDs provided, returning early');
      return;
    }
    setReleasing(ids[0]);
    try {
      console.log('[FRONTEND releaseMarks] Making API call to /api/quiz/release-marks');
      const response = await fetch("/api/quiz/release-marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionIds: ids, trackId, unreleased }),
      });
      console.log('[FRONTEND releaseMarks] API response:', response.status, response.statusText);
      await load();
      // Refresh selected submission if it was one of the updated ones
      if (selectedSub && ids.includes(selectedSub.id)) {
        setSelectedSub(s => s ? { ...s, marksReleased: !unreleased, marksReleasedAt: unreleased ? null : new Date().toISOString() } : s);
      }
    } catch (error) {
      console.error('[FRONTEND releaseMarks] Error:', error);
    } finally { setReleasing(null); }
  }

  // ── Filtering / sorting ───────────────────────────────────────────────────
  let filtered = submissions;
  if (filter === "pending") filtered = submissions.filter(s => s.gradedCount < s.totalQuestions);
  if (filter === "graded") filtered = submissions.filter(s => s.gradedCount === s.totalQuestions && !s.marksReleased);
  if (filter === "released") filtered = submissions.filter(s => s.marksReleased);

  if (sortBy === "score") filtered = [...filtered].sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1));
  if (sortBy === "name") filtered = [...filtered].sort((a, b) => (a.user.name || a.user.email).localeCompare(b.user.name || b.user.email));
  if (sortBy === "recent") filtered = [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const pendingCount = submissions.filter(s => s.gradedCount < s.totalQuestions).length;
  const gradedCount = submissions.filter(s => s.gradedCount === s.totalQuestions && !s.marksReleased).length;
  const releasedCount = submissions.filter(s => s.marksReleased).length;
  const fullyGraded = submissions.filter(s => s.gradedCount === s.totalQuestions && !s.marksReleased);

  // ── Collapsed trigger button ──────────────────────────────────────────────
  if (!expanded) {
    return (
      <>
        {/* ── New-submission toasts (always visible, even collapsed) ── */}
        <div className="fixed bottom-36 right-6 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
          {newSubmissionToasts.map(toast => (
            <div
              key={toast.id}
              className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-violet-900/95 border border-violet-500/60 shadow-2xl text-white pointer-events-auto animate-in slide-in-from-right-4 duration-300"
            >
              <div className="w-8 h-8 rounded-full bg-violet-500/30 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-violet-200">New Quiz Submission</p>
                <p className="text-xs text-violet-300 truncate">
                  <span className="text-white font-semibold">{toast.studentName}</span> submitted{" "}
                  <span className="italic">{toast.quizTitle}</span>
                </p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 text-violet-400 hover:text-white transition mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => { setExpanded(true); setNewCount(0); }}
          className="fixed bottom-24 right-6 z-40 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold text-sm shadow-2xl hover:scale-105 transition-all">
          <span className="text-xl">📋</span>
          <div className="text-left">
            <div className="text-xs opacity-80">Quiz Grading &amp; Marks Release</div>
            {(pendingCount + gradedCount) > 0 && (
              <div className="text-xs font-bold">{pendingCount > 0 ? `${pendingCount} need grading` : `${gradedCount} ready to release`}</div>
            )}
          </div>
          {/* New submissions badge (higher priority — shown in blue) */}
          {newCount > 0 && (
            <span className="relative ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex px-2.5 py-1 rounded-full bg-blue-500 text-xs font-bold">
                {newCount} new
              </span>
            </span>
          )}
          {/* Pending grading badge (only when no new-submission badge) */}
          {newCount === 0 && pendingCount > 0 && (
            <span className="relative ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex px-2.5 py-1 rounded-full bg-rose-500 text-xs font-bold">{pendingCount}</span>
            </span>
          )}
        </button>
      </>
    );
  }
  return (
    <>
      {/* ── New-submission toasts (visible even when expanded) ── */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {newSubmissionToasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-violet-900/95 border border-violet-500/60 shadow-2xl text-white pointer-events-auto animate-in slide-in-from-right-4 duration-300"
          >
            <div className="w-8 h-8 rounded-full bg-violet-500/30 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-violet-200">New Quiz Submission</p>
              <p className="text-xs text-violet-300 truncate">
                <span className="text-white font-semibold">{toast.studentName}</span> submitted{" "}
                <span className="italic">{toast.quizTitle}</span>
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-violet-400 hover:text-white transition mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="rounded-3xl border border-slate-700 bg-slate-950 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

          {/* ── Header ── */}
          <div className="shrink-0 px-6 py-5 bg-gradient-to-r from-violet-600/20 via-slate-900 to-slate-900 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">📋</span>
                <div>
                  <h2 className="font-extrabold text-white text-xl">Quiz Grading & Marks Release</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {submissions.length} total · {pendingCount} pending · {gradedCount} graded · {releasedCount} released
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Bulk release all fully-graded unreleased */}
                {fullyGraded.length > 0 && !selectedSub && (
                  <button
                    onClick={() => releaseMarks(fullyGraded.map(s => s.id))}
                    disabled={!!releasing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition disabled:opacity-50">
                    {releasing ? "⟳ Releasing…" : `📤 Release All (${fullyGraded.length})`}
                  </button>
                )}
                <button onClick={() => load(false)} disabled={loading}
                  className="text-slate-400 hover:text-white text-sm font-medium transition disabled:opacity-50">
                  {loading ? "⟳" : "↺"} Refresh
                </button>
                <button onClick={() => { setExpanded(false); setSelectedSub(null); }}
                  className="text-slate-400 hover:text-white text-2xl transition">✕</button>
              </div>
            </div>

            {/* Filters */}
            {!selectedSub && (
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <div className="flex gap-2">
                  {([
                    { key: "all", label: "All", count: submissions.length },
                    { key: "pending", label: "Needs Grading", count: pendingCount },
                    { key: "graded", label: "Ready to Release", count: gradedCount },
                    { key: "released", label: "Released to Students", count: releasedCount },
                  ] as const).map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === f.key ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                      {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                  <span>Sort:</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:border-violet-500 focus:outline-none">
                    <option value="recent">Most Recent</option>
                    <option value="score">Score</option>
                    <option value="name">Student Name</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* WEEK 3: Exam PIN Manager */}
          {!selectedSub && (
            <div className="shrink-0 px-6 pb-4">
              <button
                onClick={() => setShowPinManager(!showPinManager)}
                className="w-full text-left px-4 py-3 rounded-xl bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/30 transition text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">🔐 Exam Session PIN</span>
                    <span className="text-slate-400 text-xs">
                      {showPinManager ? '(Click to hide)' : '(Click to generate & set PIN)'}
                    </span>
                  </div>
                  <span className="text-blue-400">{showPinManager ? '▼' : '▶'}</span>
                </div>
              </button>
              {showPinManager && (
                <div className="mt-3">
                  <ExamPinManager autoGenerate={true} />
                </div>
              )}
            </div>
          )}

          {/* ── Helpful Guide Banner ── */}
          {!selectedSub && submissions.length > 0 && (
            <div className="mx-6 mt-6 mb-4 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-2">How to Grade Quizzes</h3>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-emerald-400 font-semibold mb-1">1️⃣ Click on a student</p>
                      <p className="text-slate-400 text-xs">Open their quiz submission</p>
                    </div>
                    <div>
                      <p className="text-violet-400 font-semibold mb-1">2️⃣ Click "Grade All Questions with AI"</p>
                      <p className="text-slate-400 text-xs">AI grades everything in 3-5 seconds</p>
                    </div>
                    <div>
                      <p className="text-amber-400 font-semibold mb-1">3️⃣ Review & Release</p>
                      <p className="text-slate-400 text-xs">Edit any grades, then click "Release Marks"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center text-slate-400 py-12">
                <div className="inline-block animate-spin text-3xl mb-3">⟳</div>
                <p>Loading submissions…</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-5 text-center">
                <p className="font-bold text-rose-300 mb-2">Failed to load</p>
                <p className="text-xs font-mono text-rose-400">{error}</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                <span className="text-5xl block mb-3">📭</span>
                <p className="font-medium">No quiz submissions yet</p>
              </div>
            ) : selectedSub ? (
              <GradingView
                submission={selectedSub}
                onBack={() => setSelectedSub(null)}
                trackId={trackId}
                onUpdate={load}
                onRelease={(ids, unreleased) => releaseMarks(ids, unreleased)}
                releasing={!!releasing}
              />
            ) : (
              <div className="grid gap-3">
                {filtered.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No submissions match this filter</p>
                ) : filtered.map(sub => (
                  <SubmissionCard key={sub.id} submission={sub}
                    onClick={() => setSelectedSub(sub)}
                    onRelease={(unreleased) => releaseMarks([sub.id], unreleased)}
                    releasing={releasing === sub.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Submission card ──────────────────────────────────────────────────────────

function SubmissionCard({ submission, onClick, onRelease, releasing }: {
  submission: Submission & { cheatLog?: any };
  onClick: () => void;
  onRelease: (unreleased: boolean) => void;
  releasing: boolean;
}) {
  const [showIntegrity, setShowIntegrity] = useState(false);
  const pending = submission.totalQuestions - submission.gradedCount;
  const progress = submission.totalQuestions > 0
    ? Math.round((submission.gradedCount / submission.totalQuestions) * 100) : 0;
  const fullyGraded = pending === 0;

  return (
    <>
      {showIntegrity && <IntegrityReportModal submission={submission} onClose={() => setShowIntegrity(false)} />}

      <div className="rounded-xl border border-slate-700 bg-slate-900/40 hover:border-slate-600 transition-all">
        <div className="flex items-start gap-4 p-5">
          {/* Info */}
          <button onClick={onClick} className="flex-1 text-left min-w-0 group">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-bold text-white group-hover:text-violet-300 transition truncate">
                {submission.user.name || submission.user.email}
              </p>
              {submission.marksReleased && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0">
                  📤 Marks Released
                </span>
              )}
              {submission.cheatAttempts > 0 && (
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold shrink-0">
                    <AlertTriangle className="w-4 h-4 inline" /> {submission.cheatAttempts} violation{submission.cheatAttempts > 1 ? "s" : ""}
                  </span>
                  {submission.cheatLog && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowIntegrity(true); }}
                      className="w-6 h-6 rounded-full bg-rose-500/30 hover:bg-rose-500/50 flex items-center justify-center transition"
                      title="View integrity report"
                    >
                      <span className="text-xs">🔍</span>
                    </button>
                  )}
                </div>
              )}
              {submission.autoSubmitted && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 text-[10px] font-bold shrink-0">🚨 Auto-submitted</span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{submission.node.title}</p>
            <p className="text-[10px] text-slate-600 mt-1">
              {new Date(submission.updatedAt).toLocaleString("en-GB")}
            </p>
          </button>

          {/* Score + progress */}
          <button onClick={onClick} className="text-right shrink-0">
            {submission.avgScore !== null && (
              <span className={`text-2xl font-extrabold block ${submission.avgScore >= 80 ? "text-emerald-400" :
                submission.avgScore >= 60 ? "text-sky-400" :
                  submission.avgScore >= 40 ? "text-amber-400" : "text-rose-400"
                }`}>{submission.avgScore}%</span>
            )}
            <p className="text-xs text-slate-400">{submission.gradedCount}/{submission.totalQuestions} graded</p>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden ml-auto">
              <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </button>
        </div>

        {/* Release / un-release actions (only shown when fully graded) */}
        {fullyGraded && (
          <div className="flex items-center gap-2 px-5 pb-4 pt-1 border-t border-slate-800/60">
            {submission.marksReleased ? (
              <>
                <p className="text-xs text-emerald-400 flex-1">
                  📤 Released {submission.marksReleasedAt
                    ? new Date(submission.marksReleasedAt).toLocaleDateString("en-GB")
                    : ""}
                </p>
                <button
                  onClick={() => onRelease(true)}
                  disabled={releasing}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-40">
                  {releasing ? "⟳" : "🔒 Un-release"}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-amber-400 flex-1">⏳ Marks not yet released to student</p>
                <button
                  onClick={() => onRelease(false)}
                  disabled={releasing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-40">
                  {releasing ? "⟳ Releasing…" : "📤 Release Marks"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Grading view ─────────────────────────────────────────────────────────────

function GradingView({ submission, onBack, trackId, onUpdate, onRelease, releasing }: {
  submission: Submission;
  onBack: () => void;
  trackId: string;
  onUpdate: (background?: boolean) => void;
  onRelease: (ids: string[], unreleased: boolean) => void;
  releasing: boolean;
}) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [grades, setGrades] = useState<Record<string, { score: number; notes: string }>>({});
  const [autoGrading, setAutoGrading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    async function loadResponses() {
      try {
        const res = await fetch(`/api/quiz/responses?submissionId=${submission.id}`);
        if (res.ok) {
          const data = await res.json();
          const resps: Response[] = data.responses || [];
          setResponses(resps);
          const init: Record<string, { score: number; notes: string }> = {};
          resps.forEach(r => { init[r.id] = { score: r.gradeScore ?? 50, notes: r.gradeNotes ?? "" }; });
          setGrades(init);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadResponses();
  }, [submission.id]);

  async function refreshResponses() {
    try {
      const res = await fetch(`/api/quiz/responses?submissionId=${submission.id}`);
      if (res.ok) {
        const data = await res.json();
        const resps: Response[] = data.responses || [];
        setResponses(resps);
        const updated: Record<string, { score: number; notes: string }> = {};
        resps.forEach(r => {
          updated[r.id] = {
            score: r.gradeScore ?? grades[r.id]?.score ?? 50,
            notes: r.gradeNotes ?? grades[r.id]?.notes ?? "",
          };
        });
        setGrades(updated);
      }
    } catch { /* silent */ }
    onUpdate(true); // background refresh of parent list (badge counts, avgScore)
  }

  async function autoGradeAll() {
    setAutoGrading(true);
    try {
      await fetch("/api/quiz/auto-grade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.id, trackId }),
      });
      await refreshResponses();
    } finally { setAutoGrading(false); }
  }

  async function gradeOne(responseId: string) {
    setSaving(true);
    try {
      await fetch("/api/quiz/grade", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId, gradeScore: grades[responseId]?.score ?? 0, gradeNotes: grades[responseId]?.notes ?? "", trackId }),
      });
      await refreshResponses();
      // Auto-advance to next ungraded question
      setCurrentIdx(prev => {
        const nextUngraded = responses.findIndex((r, i) => i > prev && r.gradeScore === null);
        return nextUngraded >= 0 ? nextUngraded : prev;
      });
    } finally { setSaving(false); }
  }

  async function gradeAllManual() {
    setSaving(true);
    try {
      const toGrade = responses.filter(r => r.gradeScore === null).map(r => ({
        responseId: r.id, gradeScore: grades[r.id].score, gradeNotes: grades[r.id].notes,
      }));
      if (toGrade.length > 0) {
        await fetch("/api/quiz/bulk-grade", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grades: toGrade, trackId }),
        });
      }
      await refreshResponses();
    } finally { setSaving(false); }
  }

  if (loading) return <div className="text-center text-slate-400 py-12">Loading responses…</div>;
  if (responses.length === 0) return <div className="text-center text-slate-400 py-12">No responses found</div>;

  const current = responses[currentIdx];
  const question = findQuestion(submission.node.blocks, submission.blockId, current.questionIdx);
  const ungradedCount = responses.filter(r => r.gradeScore === null).length;
  const allGraded = ungradedCount === 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition text-xl">←</button>
        <div className="flex-1">
          <p className="font-bold text-white text-lg">{submission.user.name || submission.user.email}</p>
          <p className="text-xs text-slate-400">{submission.node.title}</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          {ungradedCount > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold transition-all shadow-lg hover:shadow-violet-500/50 flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              <span>Grade All Questions with AI</span>
            </button>
          )}
          {/* Release / un-release from within grading view */}
          {allGraded && (
            submission.marksReleased ? (
              <button onClick={() => onRelease([submission.id], true)} disabled={releasing}
                className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition disabled:opacity-50 flex items-center gap-2">
                {releasing ? "⟳" : <><span>🔒</span> <span>Un-release Marks</span></>}
              </button>
            ) : (
              <button onClick={() => onRelease([submission.id], false)} disabled={releasing}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-lg">
                {releasing ? "⟳ Releasing…" : <><span>📤</span> <span>Release Marks to Student</span></>}
              </button>
            )
          )}
        </div>
      </div>

      {/* Release status banner */}
      {allGraded && (
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${submission.marksReleased
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-amber-500/30 bg-amber-500/10"
          }`}>
          <span className="text-xl">{submission.marksReleased ? "📤" : "⏳"}</span>
          <div className="flex-1">
            <p className={`text-sm font-bold ${submission.marksReleased ? "text-emerald-300" : "text-amber-300"}`}>
              {submission.marksReleased
                ? `Marks released to student${submission.marksReleasedAt ? " on " + new Date(submission.marksReleasedAt).toLocaleDateString("en-GB") : ""}`
                : "All questions graded — ready to release to student"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {submission.marksReleased
                ? "Student can now see their score and feedback in My Results."
                : "Click \"Release Marks\" above when you are done reviewing."}
            </p>
          </div>
          {submission.avgScore !== null && (
            <span className={`text-3xl font-extrabold shrink-0 ${submission.avgScore >= 80 ? "text-emerald-400" :
              submission.avgScore >= 60 ? "text-sky-400" :
                submission.avgScore >= 40 ? "text-amber-400" : "text-rose-400"
              }`}>{submission.avgScore}%</span>
          )}
        </div>
      )}

      {/* Question navigator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {responses.map((r, i) => (
          <button key={r.id} onClick={() => setCurrentIdx(i)}
            className={`shrink-0 w-10 h-10 rounded-lg font-bold text-xs transition ${i === currentIdx ? "bg-violet-600 text-white ring-2 ring-violet-400"
              : r.gradeScore !== null ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 space-y-5">
        {/* Type + status badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{QT_ICONS[current.questionType] ?? "❓"}</span>
            <div>
              <p className="text-sm font-bold text-white">Question {currentIdx + 1} of {responses.length}</p>
              <p className="text-xs text-slate-400">{QT_LABELS[current.questionType] ?? current.questionType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {current.autoGraded && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold inline-flex items-center gap-1"><Zap className="w-3 h-3" /> Auto-graded</span>
            )}
            {current.gradeScore !== null && !current.autoGraded && (
              <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold inline-flex items-center gap-1"><Check className="w-3 h-3" /> Manually graded</span>
            )}
            {current.gradeScore === null && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">⏳ Needs grading</span>
            )}
          </div>
        </div>

        {/* Question text */}
        {question && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
            <p className="text-xs text-slate-500 uppercase font-bold">Question</p>
            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{question.question}</p>
            {question.rubric && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Grading Rubric</p>
                <p className="text-xs text-slate-400 whitespace-pre-wrap">{question.rubric}</p>
              </div>
            )}
            {question.sampleAnswer && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Model Answer</p>
                <p className="text-xs text-slate-400 whitespace-pre-wrap">{question.sampleAnswer}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Student Answer — rich display for all 13 question types ── */}
        <StudentAnswerDisplay response={current} question={question} />

        {/* Grading panel — editable if not yet graded or manual override */}
        {current.gradeScore === null ? (
          <div className="space-y-4">
            {/* AI Grading Panel for subjective questions */}
            {["short", "essay", "coding"].includes(current.questionType) && current.answerText && (
              <AIGradingPanel
                question={question?.question || ""}
                studentAnswer={current.answerText}
                modelAnswer={question?.sampleAnswer}
                rubric={question?.rubric}
                questionType={current.questionType}
                currentScore={grades[current.id]?.score ?? 50}
                currentNotes={grades[current.id]?.notes ?? ""}
                onAccept={(score, notes) => {
                  setGrades(prev => ({ ...prev, [current.id]: { score, notes } }));
                  // Auto-save after accepting AI grade
                  setTimeout(() => gradeOne(current.id), 100);
                }}
                onEdit={(score, notes) => {
                  setGrades(prev => ({ ...prev, [current.id]: { score, notes } }));
                  // Auto-save after editing
                  setTimeout(() => gradeOne(current.id), 100);
                }}
              />
            )}

            {/* Manual grading form */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Score (0 – 100)</label>
                  <input type="number" min="0" max="100"
                    value={grades[current.id]?.score ?? 50}
                    onChange={e => setGrades(prev => ({ ...prev, [current.id]: { ...prev[current.id], score: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) } }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none" />
                </div>
                <div className="flex items-end gap-2">
                  {[0, 25, 50, 75, 100].map(v => (
                    <button key={v} type="button"
                      onClick={() => setGrades(prev => ({ ...prev, [current.id]: { ...prev[current.id], score: v } }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${grades[current.id]?.score === v ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Feedback for student</label>
                <textarea
                  value={grades[current.id]?.notes ?? ""}
                  onChange={e => setGrades(prev => ({ ...prev, [current.id]: { ...prev[current.id], notes: e.target.value } }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none resize-none"
                  placeholder="Provide feedback for the student…" />
              </div>
              <button onClick={() => gradeOne(current.id)} disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-bold py-3 transition disabled:opacity-50">
                {saving ? "Saving..." : <><Check className="w-4 h-4 inline" /> Save Grade</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-lg font-extrabold text-emerald-300">{current.gradeScore}%</p>
              {current.gradedAt && (
                <p className="text-xs text-slate-500">Graded {new Date(current.gradedAt).toLocaleDateString("en-GB")}</p>
              )}
            </div>
            {current.gradeNotes && (
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{current.gradeNotes}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition disabled:opacity-30">
          ← Previous
        </button>
        <button disabled={currentIdx === responses.length - 1} onClick={() => setCurrentIdx(i => i + 1)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition disabled:opacity-30">
          Next →
        </button>
        <button onClick={onBack}
          className="ml-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition">
          ← Back to List
        </button>
      </div>

      {/* Bulk AI Grading Modal */}
      <BulkAIGradingModal
        isOpen={showBulkModal}
        submissionId={submission.id}
        trackId={trackId}
        totalQuestions={responses.length}
        studentName={submission.user.name || submission.user.email}
        onClose={() => setShowBulkModal(false)}
        onComplete={() => {
          setShowBulkModal(false);
          refreshResponses();
        }}
      />
    </div>
  );
}

// ─── StudentAnswerDisplay — rich answer preview for all 13 question types ──────

function StudentAnswerDisplay({ response, question }: { response: Response; question: any }) {
  const qt = response.questionType;
  const answerText = response.answerText ?? "";
  const answerChoice = response.answerChoice;
  const fileUrl = response.fileUrl ?? null;

  // Derive file name from answerText when no real URL is available
  const fileName = answerText || null;
  // fileUrl is the authoritative source; answerText may also contain a URL
  // (written by the upload flow before fileUrl column existed)
  const resolvedUrl: string | null =
    (fileUrl && fileUrl.startsWith("/")) ? fileUrl :
      (answerText && (answerText.startsWith("/uploads/") || answerText.startsWith("http"))) ? answerText :
        null;
  const isRealUrl = !!resolvedUrl;
  const displayName = (fileName && !fileName.startsWith("/")) ? fileName : (resolvedUrl?.split("/").pop() ?? "Uploaded file");

  // Detect media type from filename extension
  function ext(name: string) {
    return name.split(".").pop()?.toLowerCase() ?? "";
  }
  function isAudioFile(name: string) {
    return ["mp3", "wav", "m4a", "ogg", "webm", "aac", "flac"].includes(ext(name));
  }
  function isVideoFile(name: string) {
    return ["mp4", "mov", "avi", "mkv", "webm", "wmv"].includes(ext(name));
  }
  function isImageFile(name: string) {
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext(name));
  }
  function isPdfFile(name: string) {
    return ext(name) === "pdf";
  }

  const label = (
    <p className="text-xs text-slate-500 uppercase font-bold mb-3 flex items-center gap-2">
      <span>📝</span> Student Answer
    </p>
  );

  const noAnswer = (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
      {label}
      <p className="text-xs text-slate-500 italic">No answer provided</p>
    </div>
  );

  // ── 1. MCQ ───────────────────────────────────────────────────────────────────
  if (qt === "mcq" && answerChoice !== null) {
    const options: string[] = question?.options ?? [];
    const correct: number = question?.correct ?? -1;
    const isCorrect = answerChoice === correct;
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
        {label}
        <div className="space-y-2">
          {options.map((opt, i) => {
            const chosen = i === answerChoice;
            const isRight = i === correct;
            return (
              <div key={i} className={`flex items-start gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium
                ${chosen && isRight ? "border-emerald-500 bg-emerald-500/15 text-emerald-200" : ""}
                ${chosen && !isRight ? "border-red-500 bg-red-500/15 text-red-200" : ""}
                ${!chosen && isRight ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" : ""}
                ${!chosen && !isRight ? "border-slate-800 text-slate-600" : ""}`}>
                <span className="font-mono text-slate-500 shrink-0">{String.fromCharCode(65 + i)}.</span>
                <span className="flex-1">{opt}</span>
                {chosen && <span className="shrink-0">{isRight ? "✓ Student's choice" : "✗ Student's choice"}</span>}
                {!chosen && isRight && <span className="shrink-0 text-emerald-400">← Correct</span>}
              </div>
            );
          })}
        </div>
        <div className={`flex items-center gap-2 text-sm font-bold mt-1 ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
          {isCorrect ? "✅ Correct" : "❌ Incorrect"}
        </div>
      </div>
    );
  }

  // ── 2. True/False ─────────────────────────────────────────────────────────────
  if (qt === "truefalse" && answerChoice !== null) {
    const correct: number = question?.correct ?? -1;
    const isCorrect = answerChoice === correct;
    const labels = ["True", "False"];
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
        {label}
        <div className="flex gap-3">
          {[0, 1].map(i => {
            const chosen = i === answerChoice;
            const isRight = i === correct;
            return (
              <div key={i} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm
                ${chosen && isRight ? "border-emerald-500 bg-emerald-500/15 text-emerald-200" : ""}
                ${chosen && !isRight ? "border-red-500 bg-red-500/15 text-red-200" : ""}
                ${!chosen && isRight ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" : ""}
                ${!chosen && !isRight ? "border-slate-800 text-slate-600" : ""}`}>
                {i === 0 ? "✓" : "✗"} {labels[i]}
                {chosen && <span className="text-xs opacity-70">(chosen)</span>}
                {!chosen && isRight && <span className="text-xs">← correct</span>}
              </div>
            );
          })}
        </div>
        <p className={`text-sm font-bold ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
          {isCorrect ? "✅ Correct" : "❌ Incorrect"}
        </p>
      </div>
    );
  }

  // ── 3. Fill-in-Blank ──────────────────────────────────────────────────────────
  if (qt === "fillin") {
    let answers: string[] = [];
    try { answers = JSON.parse(answerText); } catch { answers = [answerText]; }
    const blanks: string[] = question?.blanks ?? [];
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
        {label}
        {answers.map((ans, i) => {
          const correct = blanks[i] ?? "";
          const isRight = ans.trim().toLowerCase() === correct.trim().toLowerCase();
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 shrink-0">Blank {i + 1}:</span>
              <span className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${isRight ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-red-500/50 bg-red-500/10 text-red-300"}`}>
                {ans || <em className="opacity-50">empty</em>}
              </span>
              {!isRight && correct && (
                <span className="text-xs text-emerald-400">→ Expected: <strong>{correct}</strong></span>
              )}
              <span>{isRight ? "✅" : "❌"}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── 4. Multi-select ───────────────────────────────────────────────────────────
  if (qt === "multiselect") {
    let selected: number[] = [];
    try { selected = JSON.parse(answerText); } catch { selected = []; }
    const options: string[] = question?.options ?? [];
    const correctArr: number[] = Array.isArray(question?.correct) ? question.correct : [];
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
        {label}
        {options.map((opt, i) => {
          const chosen = selected.includes(i);
          const isRight = correctArr.includes(i);
          return (
            <div key={i} className={`flex items-start gap-3 px-4 py-2.5 rounded-xl border text-sm
              ${chosen && isRight ? "border-emerald-500 bg-emerald-500/15 text-emerald-200" : ""}
              ${chosen && !isRight ? "border-red-500 bg-red-500/15 text-red-300" : ""}
              ${!chosen && isRight ? "border-amber-500/40 bg-amber-500/5 text-amber-400" : ""}
              ${!chosen && !isRight ? "border-slate-800 text-slate-600" : ""}`}>
              <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
                ${chosen ? (isRight ? "bg-emerald-500 border-emerald-500" : "bg-red-500 border-red-500") : "border-slate-600"}`}>
                {chosen && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="flex-1">{opt}</span>
              {!chosen && isRight && <span className="text-xs text-amber-400 shrink-0">← missed</span>}
            </div>
          );
        })}
      </div>
    );
  }

  // ── 5. Matching ───────────────────────────────────────────────────────────────
  if (qt === "matching") {
    let matches: Record<string, number> = {};
    try { matches = JSON.parse(answerText); } catch { matches = {}; }
    const left: string[] = question?.leftColumn ?? [];
    const right: string[] = question?.rightColumn ?? [];
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
        {label}
        {left.map((item, i) => {
          const studentChoice = matches[String(i)];
          const hasMatch = studentChoice !== undefined && studentChoice !== null;
          // Correct: matching index should map i → i (left[i] pairs with right[i])
          const isCorrect = hasMatch && Number(studentChoice) === i;
          return (
            <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm
              ${isCorrect ? "border-emerald-500/50 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={`flex-1 font-medium ${isCorrect ? "text-emerald-200" : "text-slate-300"}`}>{item.trim()}</span>
              <span className="text-slate-500">→</span>
              <span className={`flex-1 ${isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                {hasMatch ? right[Number(studentChoice)]?.trim() ?? "?" : <em className="text-slate-500">No match selected</em>}
              </span>
              {!isCorrect && hasMatch && (
                <span className="text-xs text-emerald-400 shrink-0">✓ {right[i]?.trim()}</span>
              )}
              <span className="shrink-0">{isCorrect ? "✅" : "❌"}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── 6. Ordering ───────────────────────────────────────────────────────────────
  if (qt === "ordering") {
    let studentOrder: number[] = [];
    try { studentOrder = JSON.parse(answerText); } catch { studentOrder = []; }
    const items: string[] = question?.items ?? [];
    const correctOrder: number[] = question?.correctOrder ?? items.map((_: any, i: number) => i);
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
        {label}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-1 px-1">
          <span>Student's Order</span>
          <span className="text-emerald-500">Correct Order</span>
        </div>
        {studentOrder.map((itemIdx, pos) => {
          const isCorrect = correctOrder[pos] === itemIdx;
          return (
            <div key={pos} className={`grid grid-cols-2 gap-2 px-3 py-2 rounded-xl border text-sm
              ${isCorrect ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>{pos + 1}</span>
                <span className={isCorrect ? "text-emerald-200" : "text-red-200"}>{items[itemIdx]}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold shrink-0">{pos + 1}</span>
                <span>{items[correctOrder[pos]]}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── 7. Short Answer ──────────────────────────────────────────────────────────
  if (qt === "shortanswer" || qt === "short") {
    if (!answerText) return noAnswer;
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
        {label}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answerText}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{answerText.length} characters · {answerText.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>
    );
  }

  // ── 8. Essay ─────────────────────────────────────────────────────────────────
  if (qt === "essay") {
    if (!answerText) return noAnswer;
    const wordCount = answerText.split(/\s+/).filter(Boolean).length;
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
        {label}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-h-64 overflow-y-auto">
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{answerText}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>📄 {wordCount} words</span>
          <span>🔤 {answerText.length} characters</span>
          <span>📝 {answerText.split(/\n/).length} paragraphs</span>
        </div>
      </div>
    );
  }

  // ── 9. Code ───────────────────────────────────────────────────────────────────
  if (qt === "code" || qt === "coding") {
    if (!answerText) return noAnswer;
    const lineCount = answerText.split("\n").length;
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
        {label}
        <div className="rounded-xl overflow-hidden border border-slate-700">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-slate-400 font-mono uppercase">{question?.language ?? "code"}</span>
            <span className="text-xs text-slate-500">{lineCount} lines</span>
          </div>
          <pre className="bg-slate-900 p-4 overflow-x-auto max-h-72">
            <code className="text-sm text-emerald-300 font-mono whitespace-pre">{answerText}</code>
          </pre>
        </div>
      </div>
    );
  }

  // ── 10–13. File / Drawing / Audio / Video ─────────────────────────────────────
  if (["fileupload", "file_upload", "drawing", "drawing_upload", "audio", "audio_response", "video", "video_response"].includes(qt)) {
    const mediaUrl = resolvedUrl;

    // Drawing / Image
    if ((qt === "drawing" || qt === "drawing_upload") && mediaUrl && isImageFile(mediaUrl)) {
      return (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
          {label}
          <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl} alt="Student drawing" className="w-full max-h-96 object-contain" />
          </div>
          <p className="text-xs text-slate-500">{displayName}</p>
        </div>
      );
    }

    // Audio
    if (qt === "audio" || qt === "audio_response") {
      return (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
          {label}
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl">🎤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 mt-0.5">Audio recording</p>
            </div>
          </div>
          {mediaUrl ? (
            <audio controls className="w-full rounded-xl" style={{ colorScheme: "dark" }}>
              <source src={mediaUrl} />
              <source src={mediaUrl.replace(/\.\w+$/, ".mp3")} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>File not yet stored on server — student submitted: <strong>{displayName}</strong></span>
            </div>
          )}
        </div>
      );
    }

    // Video
    if (qt === "video" || qt === "video_response") {
      return (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
          {label}
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl">📹</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 mt-0.5">Video recording</p>
            </div>
          </div>
          {mediaUrl ? (
            <video controls className="w-full rounded-xl max-h-80 bg-black" style={{ colorScheme: "dark" }}>
              <source src={mediaUrl} />
              Your browser does not support the video element.
            </video>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>File not yet stored on server — student submitted: <strong>{displayName}</strong></span>
            </div>
          )}
        </div>
      );
    }

    // PDF
    if (mediaUrl && isPdfFile(mediaUrl)) {
      return (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
          {label}
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 text-2xl">📄</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 mt-0.5">PDF Document</p>
            </div>
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition">
              Open PDF ↗
            </a>
          </div>
          <iframe src={mediaUrl} className="w-full rounded-xl border border-slate-700" style={{ height: "400px" }} title="PDF preview" />
        </div>
      );
    }

    // Image file (drawing without mediaUrl, or generic image)
    if (mediaUrl && isImageFile(mediaUrl)) {
      return (
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
          {label}
          <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl} alt="Student submission" className="w-full max-h-96 object-contain" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{displayName}</p>
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-sky-400 hover:text-sky-300">Open full size ↗</a>
          </div>
        </div>
      );
    }

    // Generic file (doc, zip, etc.) — with or without URL
    return (
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
        {label}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 text-2xl">📎</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {ext(displayName).toUpperCase() || "File"} submission
            </p>
          </div>
          {mediaUrl ? (
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition">
              Download ↗
            </a>
          ) : (
            <span className="shrink-0 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              No URL stored
            </span>
          )}
        </div>
        {!mediaUrl && (
          <p className="text-xs text-slate-500">
            ℹ️ File upload storage is not yet configured. The student submitted the file named above.
          </p>
        )}
      </div>
    );
  }

  // ── Fallback for anything else ────────────────────────────────────────────────
  if (!answerText && answerChoice === null) return noAnswer;
  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
      {label}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {answerText || `Option ${String.fromCharCode(65 + (answerChoice ?? 0))}`}
        </p>
      </div>
    </div>
  );
}

// ─── Helper: find question definition ────────────────────────────────────────

function findQuestion(nodeBlocks: any, blockId: string, questionIdx: number) {
  const blocks: any[] = Array.isArray(nodeBlocks) ? nodeBlocks : [];
  const block = blocks.find((b: any) => b.id === blockId && b.type === "quiz");
  if (block?.questions?.[questionIdx]) return block.questions[questionIdx];
  if (block && questionIdx === 0 && block.question) return block;
  // Fallback: static MODULES registry
  for (const mod of MODULES) {
    for (const outcome of mod.outcomes) {
      for (const ic of outcome.indicativeContents) {
        for (const topic of ic.topics) {
          const b = topic.blocks.find((bl) => bl.id === blockId && bl.type === "quiz") as any;
          if (!b) continue;
          if (b.questions?.[questionIdx]) return b.questions[questionIdx];
          if (questionIdx === 0 && b.question) return b;
        }
      }
    }
  }
  return null;
}

// ─── WEEK 3: Suspicious Pattern Analyzer ──────────────────────────────────────
/**
 * Detects complex cheating patterns by correlating events.
 * Returns array of { name, severity, description, events, icon }
 */
function analyzeSuspiciousPatterns(violations: any[], log: any) {
  const patterns: Array<{
    name: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    events: any[];
    icon: string;
  }> = [];

  const allEvents = log.auditEvents || [];

  // Pattern 1 — Burst cheating (≥5 violations within 60 seconds)
  const sortedByTime = [...violations].sort((a, b) => (a.timestamp || a.ts) - (b.timestamp || b.ts));
  for (let i = 0; i < sortedByTime.length - 4; i++) {
    const window = sortedByTime.slice(i, i + 5);
    const timeSpan = (window[4].timestamp || window[4].ts) - (window[0].timestamp || window[0].ts);
    if (timeSpan < 60000) { // 60 seconds
      patterns.push({
        name: 'Burst Activity',
        severity: 'high',
        description: `${window.length} violations in ${Math.round(timeSpan / 1000)}s — possible panic or external assistance`,
        events: window,
        icon: '⚡',
      });
      break; // Only flag once
    }
  }

  // Pattern 2 — External lookup (browser + clipboard + blur)
  const hasBrowser = violations.some((e: any) =>
    (e.type === 'PROCESS_KILLED' || e.type === 'PROCESS_KILLED_NAME') &&
    e.process && ['firefox', 'chrome', 'brave'].some(b => e.process.toLowerCase().includes(b))
  );
  const hasClipboard = violations.some((e: any) => e.type === 'CLIPBOARD_CHANGE');
  const hasBlur = violations.some((e: any) => e.type === 'WINDOW_BLUR');

  if (hasBrowser && hasClipboard && hasBlur) {
    patterns.push({
      name: 'External Lookup Pattern',
      severity: 'critical',
      description: 'Browser + clipboard activity + focus loss — likely searching for answers externally',
      events: violations.filter((e: any) =>
        ['PROCESS_KILLED', 'PROCESS_KILLED_NAME', 'CLIPBOARD_CHANGE', 'WINDOW_BLUR'].includes(e.type)
      ).slice(0, 5),
      icon: '🔍',
    });
  }

  // Pattern 3 — Renamed executable detected (Tier 2 window-title hits)
  const tier2Hits = allEvents.filter((e: any) =>
    e.type === 'PROCESS_SUSPICIOUS_TITLE' && e.tier === 2
  );
  if (tier2Hits.length > 0) {
    patterns.push({
      name: 'Renamed Executable Detected',
      severity: 'critical',
      description: 'Window-title analysis caught a suspicious process (likely renamed to evade detection)',
      events: tier2Hits,
      icon: '🎭',
    });
  }

  // Pattern 4 — Persistent process (killed multiple times)
  const processKills = violations.filter((e: any) =>
    e.type === 'PROCESS_KILLED' || e.type === 'PROCESS_KILLED_NAME'
  );
  const killsByProc = new Map<string, any[]>();
  for (const ev of processKills) {
    const proc = ev.process || ev.app || 'unknown';
    if (!killsByProc.has(proc)) killsByProc.set(proc, []);
    killsByProc.get(proc)!.push(ev);
  }

  for (const [proc, kills] of killsByProc) {
    if (kills.length >= 3) {
      patterns.push({
        name: 'Persistent Violation',
        severity: 'high',
        description: `Process "${proc}" was killed ${kills.length}× — student repeatedly reopened a forbidden app`,
        events: kills,
        icon: '🔁',
      });
    }
  }

  // Pattern 5 — VM + ungraceful exit (if we have that data)
  const vmDetected = allEvents.some((e: any) => e.type === 'VM_DETECTED') || log.vmDetection?.isVM;
  const ungracefulExit = allEvents.some((e: any) => e.type === 'UNGRACEFUL_EXIT');

  if (vmDetected && ungracefulExit) {
    patterns.push({
      name: 'VM Snapshot Attack',
      severity: 'critical',
      description: 'Running in VM + ungraceful exit — possible snapshot/restore to retry exam',
      events: allEvents.filter((e: any) => ['VM_DETECTED', 'UNGRACEFUL_EXIT'].includes(e.type)),
      icon: '💾',
    });
  } else if (vmDetected) {
    patterns.push({
      name: 'Virtual Machine Detected',
      severity: 'medium',
      description: 'Exam was taken inside a VM — monitor for snapshot/restore abuse',
      events: allEvents.filter((e: any) => e.type === 'VM_DETECTED'),
      icon: '🖥️',
    });
  }

  // Pattern 6 — Integrity tampering
  const tampering = allEvents.filter((e: any) =>
    ['APP_TAMPERED', 'INTEGRITY_VIOLATION', 'EXAM_BLOCKED_INTEGRITY'].includes(e.type)
  );
  if (tampering.length > 0) {
    patterns.push({
      name: 'App Tampering Detected',
      severity: 'critical',
      description: 'Integrity check failed — student modified the exam app files',
      events: tampering,
      icon: '⚠️',
    });
  }

  return patterns;
}
// ──────────────────────────────────────────────────────────────────────────────

// ─── Integrity Report Modal ───────────────────────────────────────────────────

function IntegrityReportModal({ submission, onClose }: { submission: Submission & { cheatLog?: any }; onClose: () => void }) {
  const report = submission.cheatLog;
  if (!report) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Integrity Report</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">✕</button>
          </div>
          <p className="text-slate-400 text-center py-8">No audit data available for this submission.</p>
        </div>
      </div>
    );
  }

  const events = report.auditEvents || [];
  const focusLossCount = report.focusLossCount || 0;
  const durationMs = report.durationMs || 0;
  const questionTimings = report.questionTimingsMs || {};

  // Count events by type
  const eventCounts: Record<string, number> = {};
  events.forEach((ev: any) => {
    eventCounts[ev.type] = (eventCounts[ev.type] || 0) + 1;
  });

  // Convert timings to array for chart
  const timingData = Object.entries(questionTimings).map(([idx, data]: [string, any]) => ({
    questionIdx: parseInt(idx),
    totalMs: data.totalMs || 0,
  })).sort((a, b) => a.questionIdx - b.questionIdx);

  const maxTime = Math.max(...timingData.map(t => t.totalMs), 1);

  // ─── WEEK 3: Suspicious Pattern Analysis ────────────────────────────────────
  const violations = events.filter((e: any) => [
    'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'PROCESS_KILLED', 'PROCESS_KILLED_NAME',
    'SCREENSHOT_ATTEMPT', 'CLIPBOARD_CHANGE', 'TAB_SWITCH_BLOCKED',
    'SUSPICIOUS_PROCESS_DETECTED', 'PROCESS_SUSPICIOUS_TITLE',
    'DISPLAY_ADDED', 'EXTERNAL_DISPLAY', 'ESCAPE_PRESSED', 'PASTE_BLOCKED',
  ].includes(e.type));
  const patterns = analyzeSuspiciousPatterns(violations, report);
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-5 bg-gradient-to-r from-rose-600/20 via-slate-900 to-slate-900 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Exam Integrity Report</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {submission.user.name || submission.user.email} · {new Date(submission.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl transition">✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* WEEK 3: Suspicious Patterns */}
          {patterns.length > 0 && (
            <div className="rounded-xl border-2 border-rose-500/50 bg-gradient-to-br from-rose-900/20 to-orange-900/20 p-5">
              <h4 className="text-lg font-bold text-rose-300 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Suspicious Patterns Detected ({patterns.length})
              </h4>
              <div className="space-y-3">
                {patterns.map((pattern, idx) => {
                  const severityBg = {
                    critical: 'bg-rose-500/20 border-rose-500',
                    high: 'bg-orange-500/20 border-orange-500',
                    medium: 'bg-yellow-500/20 border-yellow-500',
                    low: 'bg-slate-500/20 border-slate-500',
                  }[pattern.severity];
                  const severityText = {
                    critical: 'text-rose-300',
                    high: 'text-orange-300',
                    medium: 'text-yellow-300',
                    low: 'text-slate-300',
                  }[pattern.severity];

                  return (
                    <div key={idx} className={`${severityBg} border rounded-lg p-4`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{pattern.icon}</div>
                        <div className="flex-1">
                          <div className={`font-bold ${severityText} text-lg`}>
                            {pattern.name}
                          </div>
                          <p className="text-sm text-slate-300 mt-1">{pattern.description}</p>
                          <div className="text-xs text-slate-400 mt-2">
                            {pattern.events.length} related event{pattern.events.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-xs text-slate-400 mb-1">Session Duration</p>
              <p className="text-2xl font-bold text-white">{Math.round(durationMs / 60000)}m</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-xs text-slate-400 mb-1">Focus Losses</p>
              <p className={`text-2xl font-bold ${focusLossCount > 10 ? 'text-rose-400' : focusLossCount > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {focusLossCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-xs text-slate-400 mb-1">Violations</p>
              <p className={`text-2xl font-bold ${submission.cheatAttempts > 5 ? 'text-rose-400' : submission.cheatAttempts > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {submission.cheatAttempts}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <p className="text-xs text-slate-400 mb-1">Total Events</p>
              <p className="text-2xl font-bold text-white">{events.length}</p>
            </div>
          </div>

          {/* Event Type Summary */}
          {Object.keys(eventCounts).length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                Event Summary
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(eventCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60">
                    <span className="text-sm text-slate-300 font-medium">{type.replace(/_/g, ' ')}</span>
                    <span className={`text-sm font-bold ${getSeverityColor(type)}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time per Question */}
          {timingData.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Time Spent per Question
              </h4>
              <div className="space-y-2">
                {timingData.map(({ questionIdx, totalMs }) => (
                  <div key={questionIdx} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-16 shrink-0">Q{questionIdx + 1}</span>
                    <div className="flex-1 h-6 bg-slate-900/60 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all"
                        style={{ width: `${(totalMs / maxTime) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 font-mono w-16 text-right">
                      {Math.round(totalMs / 1000)}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Timeline */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Event Timeline ({events.length} events)
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {events.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No events recorded</p>
              ) : (
                events.map((ev: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 transition text-xs">
                    <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${getEventDotColor(ev.type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white">{ev.type.replace(/_/g, ' ')}</span>
                        {ev.severity && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ev.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {ev.severity}
                          </span>
                        )}
                      </div>
                      {renderEventDetail(ev)}
                    </div>
                    <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                      {new Date(ev.ts).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSeverityColor(eventType: string): string {
  const high = ['PROCESS_DETECTED', 'PROCESS_KILLED', 'DISPLAY_ADDED', 'CLIPBOARD_CHANGED'];
  if (high.includes(eventType)) return 'text-rose-400';
  return 'text-amber-400';
}

function getEventDotColor(eventType: string): string {
  const high = ['PROCESS_DETECTED', 'PROCESS_KILLED', 'DISPLAY_ADDED', 'CLIPBOARD_CHANGED'];
  if (high.includes(eventType)) return 'bg-rose-500';
  if (eventType === 'FOCUS_LOST') return 'bg-amber-500';
  return 'bg-sky-500';
}

function renderEventDetail(ev: any): JSX.Element {
  const detail: string[] = [];
  if (ev.app) detail.push(`App: ${ev.app}`);
  if (ev.category) detail.push(`Category: ${ev.category}`);
  if (ev.preview) detail.push(`Content: "${ev.preview}"`);
  if (ev.displayId) detail.push(`Display: ${ev.displayId}`);
  if (ev.blurCount) detail.push(`Total blurs: ${ev.blurCount}`);
  if (ev.questionIdx !== undefined) detail.push(`Question: ${ev.questionIdx + 1}`);

  return (
    <p className="text-slate-400 text-[11px] leading-relaxed">
      {detail.length > 0 ? detail.join(' · ') : 'No additional details'}
    </p>
  );
}
