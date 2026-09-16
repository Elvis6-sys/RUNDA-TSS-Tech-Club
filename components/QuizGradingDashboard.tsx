"use client";

import { useState, useEffect } from "react";

type Submission = {
  id: string;
  userId: string;
  nodeId: string;
  blockId: string;
  status: string;
  totalQuestions: number;
  gradedCount: number;
  avgScore: number | null;
  user: { id: string; name: string | null; email: string };
  node: { id: string; title: string };
};

const TIER_ACCENT: Record<string, string> = {
  l3: "text-emerald-400",
  l4: "text-sky-400",
  l5: "text-violet-400",
};

export default function QuizGradingDashboard({ trackId }: { trackId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/grade?trackId=${encodeURIComponent(trackId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(`${res.status}: ${data.error ?? "Unknown error"}`);
      } else {
        setSubmissions(data.submissions || []);
      }
    } catch (e) {
      setError(String(e));
      console.error("Failed to load submissions", e);
    } finally {
      setLoading(false);
    }
  }

  // Load on mount and whenever the panel is opened
  useEffect(() => { load(); }, [trackId]);
  useEffect(() => { if (expanded) load(); }, [expanded]);

  const needsGrading = submissions.filter(s => s.status === "grading" || (s.avgScore === null && s.gradedCount < s.totalQuestions));
  const fullyGraded = submissions.filter(s => s.avgScore !== null);
  const completed = submissions.filter(s => s.status === "graded");

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition">
        <span className="text-lg">📋</span>
        <span>Quiz Grading</span>
        {needsGrading.length > 0 && (
          <span className="ml-2 px-2 py-1 rounded-full bg-rose-500 text-xs font-bold">
            {needsGrading.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-950 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-600/20 to-slate-900 border-b border-slate-700">
          <div>
            <h2 className="font-bold text-white text-lg">Quiz Submissions</h2>
            <p className="text-xs text-slate-400 mt-1">
              {needsGrading.length} need grading · {fullyGraded.length} graded
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="text-slate-400 hover:text-white text-sm transition disabled:opacity-50">
              {loading ? "⟳" : "↺"} Refresh
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-white text-2xl transition ml-2">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 p-6">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading submissions...</div>
          ) : error ? (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-300">
              <p className="font-bold mb-1">Failed to load submissions</p>
              <p className="text-xs font-mono">{error}</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No quiz submissions yet</div>
          ) : selectedSubmission ? (
            <SubmissionDetail submission={selectedSubmission} onBack={() => setSelectedSubmission(null)} trackId={trackId} />
          ) : (
            <>
              {/* Needs grading */}
              {needsGrading.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-rose-400 uppercase">Pending Grading</p>
                  {needsGrading.map(sub => (
                    <SubmissionRow key={sub.id} submission={sub} onClick={() => setSelectedSubmission(sub)} />
                  ))}
                </div>
              )}

              {/* Completed */}
              {completed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-400 uppercase">Graded</p>
                  {completed.map(sub => (
                    <SubmissionRow key={sub.id} submission={sub} onClick={() => setSelectedSubmission(sub)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionRow({ submission, onClick }: { submission: Submission; onClick: () => void }) {
  const statusColor = submission.avgScore !== null ? "emerald" : "amber";
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 p-4 text-left transition text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">{submission.user.name || submission.user.email}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{submission.node.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs text-slate-400">
              {submission.gradedCount} / {submission.totalQuestions}
            </p>
            {submission.avgScore !== null && (
              <p className={`font-bold text-sm ${statusColor === "emerald" ? "text-emerald-400" : "text-amber-400"}`}>
                {submission.avgScore}%
              </p>
            )}
          </div>
          <span className={`text-lg ${statusColor === "emerald" ? "text-emerald-500" : "text-amber-500"}`}>
            {submission.avgScore !== null ? "✓" : "⏳"}
          </span>
        </div>
      </div>
    </button>
  );
}

function SubmissionDetail({
  submission,
  onBack,
  trackId,
}: {
  submission: Submission;
  onBack: () => void;
  trackId: string;
}) {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<Record<string, { score: number; notes: string }>>({});

  useEffect(() => {
    async function loadResponses() {
      try {
        const res = await fetch(`/api/quiz/responses?submissionId=${submission.id}`);
        if (res.ok) {
          const data = await res.json();
          setResponses(data.responses || []);
          // Initialize grading state
          const init: Record<string, { score: number; notes: string }> = {};
          (data.responses || []).forEach((r: any) => {
            init[r.id] = { score: r.gradeScore ?? 50, notes: r.gradeNotes ?? "" };
          });
          setGrading(init);
        }
      } catch (e) {
        console.error("Failed to load responses", e);
      } finally {
        setLoading(false);
      }
    }
    loadResponses();
  }, [submission.id]);

  async function gradeResponse(responseId: string) {
    const g = grading[responseId];
    try {
      await fetch("/api/quiz/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId,
          gradeScore: g.score,
          gradeNotes: g.notes,
          trackId,
        }),
      });
      // Refresh
      onBack();
    } catch (e) {
      console.error("Grade failed", e);
    }
  }

  return (
    <div className="space-y-4">
      {/* Back button + header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white transition text-lg">
          ←
        </button>
        <div>
          <p className="font-bold text-white">{submission.user.name || submission.user.email}</p>
          <p className="text-xs text-slate-400">{submission.node.title}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading responses...</p>
      ) : responses.length === 0 ? (
        <p className="text-slate-400 text-sm">No responses yet</p>
      ) : (
        <div className="space-y-3">
          {responses.map((r, i) => (
            <div key={r.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Question {i + 1}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${r.gradeScore !== null ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {r.questionType}
                </span>
              </div>

              {/* Student answer */}
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                <p className="text-xs text-slate-500 mb-1">Student answer:</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {r.answerText || `Option ${String.fromCharCode(65 + (r.answerChoice ?? 0))}`}
                </p>
              </div>

              {/* Grading controls */}
              {r.gradeScore === null && (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Score (0-100)</p>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={grading[r.id]?.score ?? 50}
                      onChange={e => setGrading(prev => ({
                        ...prev,
                        [r.id]: { ...prev[r.id], score: parseInt(e.target.value) || 0 },
                      }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Notes</p>
                    <textarea
                      value={grading[r.id]?.notes ?? ""}
                      onChange={e => setGrading(prev => ({
                        ...prev,
                        [r.id]: { ...prev[r.id], notes: e.target.value },
                      }))}
                      rows={2}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none resize-none"
                      placeholder="Feedback for student..."
                    />
                  </div>
                  <button
                    onClick={() => gradeResponse(r.id)}
                    className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-2 transition">
                    ✓ Grade
                  </button>
                </div>
              )}

              {/* Already graded */}
              {r.gradeScore !== null && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                  <p className="text-sm font-bold text-emerald-300">Score: {r.gradeScore}%</p>
                  {r.gradeNotes && <p className="text-xs text-slate-300 mt-1">{r.gradeNotes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
