"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check, X, AlertCircle, Zap, Edit3, RefreshCw, CheckCircle, FileText, Image, Music, Video, Paperclip } from "lucide-react";

type GradeResult = {
  responseId: string;
  questionIdx: number;
  questionType: string;
  suggestedScore: number;
  feedback: string;
  confidence: number;
  autoGraded: boolean;
  strengths?: string[];
  improvements?: string[];
};

// Minimal shape of a QuizResponse — just what we need for previewing answers
type ResponsePreview = {
  id: string;
  questionIdx: number;
  questionType: string;
  answerChoice: number | null;
  answerText: string | null;
  fileUrl: string | null;
};

type BulkAIGradingModalProps = {
  isOpen: boolean;
  submissionId: string;
  trackId: string;
  totalQuestions: number;
  studentName: string;
  onClose: () => void;
  onComplete: () => void;
};

export default function BulkAIGradingModal({
  isOpen,
  submissionId,
  trackId,
  totalQuestions,
  studentName,
  onClose,
  onComplete,
}: BulkAIGradingModalProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GradeResult[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkWarning, setNetworkWarning] = useState(false);
  // Map responseId → ResponsePreview so we can show student answers inline
  const [responseMap, setResponseMap] = useState<Record<string, ResponsePreview>>({});

  // Load actual student responses (with fileUrl) when modal opens
  useEffect(() => {
    if (!isOpen || !submissionId) return;
    fetch(`/api/quiz/responses?submissionId=${encodeURIComponent(submissionId)}`)
      .then(r => r.json())
      .then(data => {
        const map: Record<string, ResponsePreview> = {};
        (data.responses ?? []).forEach((r: ResponsePreview) => { map[r.id] = r; });
        setResponseMap(map);
      })
      .catch(() => {/* non-fatal */ });
  }, [isOpen, submissionId]);

  if (!isOpen) return null;

  async function startBulkGrading() {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/quiz/bulk-ai-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, trackId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bulk grading failed");
      }

      const data = await res.json();
      setResults(data.results || []);
      if (data.networkIssues) {
        setNetworkWarning(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grade");
    } finally {
      setLoading(false);
    }
  }

  async function acceptAllGrades() {
    console.log('[BulkAIGradingModal] acceptAllGrades called, results:', results.length);
    setSaving(true);
    try {
      const grades = results.map(r => ({
        responseId: r.responseId,
        gradeScore: r.suggestedScore,
        gradeNotes: r.feedback,
      }));

      console.log('[BulkAIGradingModal] Calling /api/quiz/bulk-grade with', grades.length, 'grades, trackId:', trackId);
      const response = await fetch("/api/quiz/bulk-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades, trackId }),
      });

      console.log('[BulkAIGradingModal] API response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[BulkAIGradingModal] API error:', errorData);
        throw new Error(errorData.error || 'Failed to save grades');
      }

      onComplete();
      onClose();
    } catch (err) {
      console.error('[BulkAIGradingModal] Error:', err);
      setError(err instanceof Error ? err.message : "Failed to save grades");
    } finally {
      setSaving(false);
    }
  }

  async function saveEditedGrade(result: GradeResult) {
    setSaving(true);
    try {
      await fetch("/api/quiz/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId: result.responseId,
          gradeScore: editScore,
          gradeNotes: editNotes,
          trackId,
        }),
      });

      // Update local result
      setResults(prev =>
        prev.map(r =>
          r.responseId === result.responseId
            ? { ...r, suggestedScore: editScore, feedback: editNotes }
            : r
        )
      );
      setEditingId(null);
    } catch (err) {
      setError("Failed to save grade");
    } finally {
      setSaving(false);
    }
  }

  const objectiveCount = results.filter(r => r.autoGraded).length;
  const subjectiveCount = results.filter(r => !r.autoGraded).length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.suggestedScore, 0) / results.length)
    : 0;
  const highConfidence = results.filter(r => r.confidence >= 80).length;
  const mediumConfidence = results.filter(r => r.confidence >= 60 && r.confidence < 80).length;
  const lowConfidence = results.filter(r => r.confidence < 60).length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-sky-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-emerald-500/20 text-emerald-400";
    if (confidence >= 60) return "bg-sky-500/20 text-sky-400";
    if (confidence >= 40) return "bg-amber-500/20 text-amber-400";
    return "bg-rose-500/20 text-rose-400";
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="rounded-3xl border border-violet-500/30 bg-slate-950 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="shrink-0 px-6 py-5 bg-gradient-to-r from-violet-600/20 via-purple-600/10 to-slate-900 border-b border-violet-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-2xl">AI Grading Assistant</h2>
                <p className="text-sm text-slate-300 mt-1">
                  {studentName} · {totalQuestions} questions total
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-3xl transition w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!loading && results.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-bold text-white text-2xl mb-3">Ready to Grade All Questions</h3>
              <div className="max-w-xl mx-auto space-y-3 mb-8">
                <div className="flex items-start gap-3 text-left bg-slate-800/50 rounded-lg p-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-300">Objective Questions</p>
                    <p className="text-xs text-slate-400 mt-1">
                      MCQ, True/False, Fill-in, Matching → Graded automatically with 100% accuracy
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left bg-slate-800/50 rounded-lg p-4">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-violet-300">Subjective Questions</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Essays, Short Answers, Coding → AI suggests grades with detailed feedback
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left bg-slate-800/50 rounded-lg p-4">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Edit3 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-300">Your Review</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Review all grades and edit any you disagree with before saving
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={startBulkGrading}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-lg transition-all shadow-2xl hover:shadow-violet-500/50 inline-flex items-center gap-3"
              >
                <Sparkles className="w-6 h-6" />
                Start AI Grading
              </button>
              <p className="text-xs text-slate-500 mt-4">Takes 3–5 seconds · Powered by Groq AI (FREE)</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin"></div>
                <Sparkles className="w-8 h-8 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">AI is grading...</h3>
              <p className="text-sm text-slate-400">
                Analyzing {totalQuestions} questions. This may take a moment.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 mb-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-rose-300 mb-1">Grading Failed</h3>
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              {networkWarning && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-300 text-sm mb-1">AI Service Connectivity Issue</h3>
                      <p className="text-xs text-amber-400">
                        Some subjective questions couldn't be graded by AI due to network issues.
                        They've been marked with 50% scores for your manual review.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-center">
                  <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-bold">Average Score</p>
                  <p className={`text-4xl font-extrabold ${getScoreColor(avgScore)}`}>{avgScore}%</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                  <p className="text-xs text-emerald-300 mb-2 uppercase tracking-wide font-bold">Auto-Graded</p>
                  <p className="text-4xl font-extrabold text-emerald-400">{objectiveCount}</p>
                  <p className="text-[10px] text-emerald-400/70 mt-1">Objective questions</p>
                </div>
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5 text-center">
                  <p className="text-xs text-violet-300 mb-2 uppercase tracking-wide font-bold">AI-Suggested</p>
                  <p className="text-4xl font-extrabold text-violet-400">{subjectiveCount}</p>
                  <p className="text-[10px] text-violet-400/70 mt-1">Subjective questions</p>
                </div>
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-5 text-center">
                  <p className="text-xs text-sky-300 mb-2 uppercase tracking-wide font-bold">High Confidence</p>
                  <p className="text-4xl font-extrabold text-sky-400">{highConfidence}</p>
                  <p className="text-[10px] text-sky-400/70 mt-1">AI is confident</p>
                </div>
              </div>

              {/* Grade List */}
              <div>
                <div className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-violet-400" />
                    Review All Grades ({results.length} questions)
                  </h3>
                  <p className="text-sm text-slate-300 mb-2">
                    ✅ <span className="font-semibold text-emerald-400">Green badges</span> = Auto-graded objective questions (100% accurate)
                  </p>
                  <p className="text-sm text-slate-300 mb-2">
                    🤖 <span className="font-semibold text-violet-400">Purple badges</span> = AI-suggested grades (review and edit if needed)
                  </p>
                  <p className="text-sm text-amber-300 font-semibold">
                    💡 Click "Edit Grade" on any AI-suggested answer to change the score or feedback
                  </p>
                </div>
                <div className="space-y-3">
                  {results.map((result, idx) => (
                    <div
                      key={result.responseId}
                      className={`rounded-xl p-5 transition ${result.autoGraded
                        ? "border-2 border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                        : "border-2 border-violet-500/40 bg-violet-500/5 hover:border-violet-500/60"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                            {result.questionIdx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-slate-400 capitalize">
                                {result.questionType.replace(/_/g, " ")}
                              </span>
                              {result.autoGraded ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> Auto-graded
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold inline-flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> AI-suggested
                                </span>
                              )}
                              {!result.autoGraded && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getConfidenceColor(result.confidence)}`}>
                                  {result.confidence}% confidence
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-extrabold ${getScoreColor(result.suggestedScore)}`}>
                            {result.suggestedScore}
                          </p>
                        </div>
                      </div>

                      {/* ── Student Answer Preview ── */}
                      <BulkAnswerPreview preview={responseMap[result.responseId]} />

                      {editingId === result.responseId ? (
                        <div className="space-y-3 pt-3 border-t border-slate-800">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-slate-400 font-bold block mb-1">Score</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editScore}
                                onChange={(e) => setEditScore(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              {[0, 50, 75, 100].map(v => (
                                <button
                                  key={v}
                                  onClick={() => setEditScore(v)}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${editScore === v ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 font-bold block mb-1">Feedback</label>
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditedGrade(result)}
                              disabled={saving}
                              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-slate-300 mb-3">{result.feedback}</p>
                          {result.strengths && result.strengths.length > 0 && (
                            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 mb-2">
                              <p className="text-xs text-emerald-400 font-bold mb-1">✓ Strengths</p>
                              <ul className="space-y-1">
                                {result.strengths.map((s, i) => (
                                  <li key={i} className="text-xs text-slate-300">• {s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.improvements && result.improvements.length > 0 && (
                            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 mb-3">
                              <p className="text-xs text-amber-400 font-bold mb-1">→ Improvements</p>
                              <ul className="space-y-1">
                                {result.improvements.map((imp, i) => (
                                  <li key={i} className="text-xs text-slate-300">• {imp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {!result.autoGraded && (
                            <button
                              onClick={() => {
                                setEditingId(result.responseId);
                                setEditScore(result.suggestedScore);
                                setEditNotes(result.feedback);
                              }}
                              className="text-violet-400 hover:text-violet-300 text-xs font-bold inline-flex items-center gap-1 transition"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit Grade
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="shrink-0 px-6 py-5 border-t border-slate-700 bg-slate-900/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-white mb-1">
                  Ready to save these grades?
                </p>
                <p className="text-xs text-slate-400">
                  You can edit any grade above before saving. Grades won't be visible to students until you "Release Marks".
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={acceptAllGrades}
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold transition-all shadow-xl disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {saving ? "Saving..." : "Save All Grades"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BulkAnswerPreview ────────────────────────────────────────────────────────
// Compact inline student-answer preview for the AI grading modal.
// Shows the relevant content so the teacher can judge the AI's suggested score
// without opening the full GradingView.

function BulkAnswerPreview({ preview }: { preview: ResponsePreview | undefined }) {
  if (!preview) return null;

  const qt = preview.questionType;
  const text = preview.answerText ?? "";
  const choice = preview.answerChoice;

  // Resolve best URL: fileUrl column first, then answerText if it looks like a path
  const resolvedUrl: string | null =
    (preview.fileUrl?.startsWith("/")) ? preview.fileUrl :
      (text.startsWith("/uploads/")) ? text :
        null;

  const displayName = resolvedUrl ? resolvedUrl.split("/").pop() ?? "file" : text;

  function ext(name: string) { return name.split(".").pop()?.toLowerCase() ?? ""; }

  // Nothing to show for objective types (the score already tells the story)
  if (["mcq", "truefalse", "multiselect", "matching", "ordering", "fillin"].includes(qt)) {
    return null;
  }

  // Text answers
  if (["shortanswer", "short", "essay", "code", "coding"].includes(qt) && text) {
    const isCode = qt === "code" || qt === "coding";
    return (
      <div className="mt-2 mb-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2.5">
        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Student Answer</p>
        <p className={`text-xs leading-relaxed line-clamp-4 ${isCode ? "font-mono text-emerald-300 whitespace-pre-wrap" : "text-slate-300 whitespace-pre-wrap"}`}>
          {text}
        </p>
        {text.length > 300 && (
          <p className="text-[10px] text-slate-500 mt-1">{text.split(/\s+/).filter(Boolean).length} words</p>
        )}
      </div>
    );
  }

  // Audio
  if ((qt === "audio" || qt === "audio_response") && resolvedUrl) {
    return (
      <div className="mt-2 mb-1 space-y-1.5">
        <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Music className="w-3 h-3" /> Student Audio</p>
        <audio controls className="w-full h-9" style={{ colorScheme: "dark" }}>
          <source src={resolvedUrl} />
        </audio>
        <p className="text-[10px] text-slate-500 truncate">{displayName}</p>
      </div>
    );
  }

  // Video
  if ((qt === "video" || qt === "video_response") && resolvedUrl) {
    return (
      <div className="mt-2 mb-1 space-y-1.5">
        <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Video className="w-3 h-3" /> Student Video</p>
        <video controls className="w-full rounded-lg max-h-48 bg-black" style={{ colorScheme: "dark" }}>
          <source src={resolvedUrl} />
        </video>
        <p className="text-[10px] text-slate-500 truncate">{displayName}</p>
      </div>
    );
  }

  // Drawing / image
  if ((qt === "drawing" || qt === "drawing_upload") && resolvedUrl) {
    const e = ext(resolvedUrl);
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(e)) {
      return (
        <div className="mt-2 mb-1 space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Image className="w-3 h-3" /> Student Drawing</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolvedUrl} alt="Drawing" className="w-full max-h-48 object-contain rounded-lg border border-slate-700 bg-slate-900" />
        </div>
      );
    }
  }

  // PDF file
  if ((qt === "fileupload" || qt === "file_upload") && resolvedUrl) {
    const e = ext(resolvedUrl);
    if (e === "pdf") {
      return (
        <div className="mt-2 mb-1 space-y-1.5">
          <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> Student File</p>
          <iframe src={resolvedUrl} className="w-full rounded-lg border border-slate-700" style={{ height: "280px" }} title="PDF" />
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300">
            <FileText className="w-3 h-3" /> Open full PDF ↗
          </a>
        </div>
      );
    }
    // Other file types
    if (resolvedUrl) {
      return (
        <div className="mt-2 mb-1 flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
          <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-300 flex-1 truncate">{displayName}</p>
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-xs text-sky-400 hover:text-sky-300 font-bold">Download ↗</a>
        </div>
      );
    }
  }

  // Filename only (no URL stored yet)
  if (text && !text.startsWith("/") && (qt === "fileupload" || qt === "audio" || qt === "video" || qt === "drawing")) {
    return (
      <div className="mt-2 mb-1 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
        <Paperclip className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-xs text-amber-300 flex-1 truncate">{text}</p>
        <span className="text-[10px] text-amber-500">No URL</span>
      </div>
    );
  }

  return null;
}
