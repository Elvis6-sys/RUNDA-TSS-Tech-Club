"use client";

import { useEffect, useState } from "react";

type Submission = {
  id: string;
  status: string;
  totalQuestions: number;
  gradedCount: number;
  avgScore: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function QuizResponseTracker({
  nodeId,
  blockId,
  tier = "l4",
}: {
  nodeId: string;
  blockId: string;
  tier?: string;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/quiz/submissions?nodeId=${nodeId}&blockId=${blockId}`
        );
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data.submissions || []);
        }
      } catch (e) {
        console.error("Failed to load submissions", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [nodeId, blockId]);

  if (loading) {
    return <div className="text-xs text-slate-500">Loading quiz status...</div>;
  }

  if (submissions.length === 0) {
    return null; // No submissions yet
  }

  const latestSubmission = submissions[0];
  const tierAccent: Record<string, string> = {
    l3: "text-emerald-400",
    l4: "text-sky-400",
    l5: "text-violet-400",
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-300">Quiz Submission</p>
        <span
          className={`text-xs px-2 py-1 rounded-full font-bold ${
            latestSubmission.avgScore !== null
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {latestSubmission.avgScore !== null ? "✓ Graded" : "⏳ Pending"}
        </span>
      </div>

      <div className="text-xs text-slate-400 space-y-1">
        <p>
          Questions: <span className="text-white font-bold">{latestSubmission.gradedCount}/{latestSubmission.totalQuestions}</span> graded
        </p>
        {latestSubmission.avgScore !== null && (
          <p>
            Score:{" "}
            <span className={`font-bold ${tierAccent[tier] || tierAccent.l4}`}>
              {latestSubmission.avgScore}%
            </span>
          </p>
        )}
      </div>

      {submissions.length > 1 && (
        <p className="text-xs text-slate-500 pt-1">
          {submissions.length} submissions total
        </p>
      )}
    </div>
  );
}
