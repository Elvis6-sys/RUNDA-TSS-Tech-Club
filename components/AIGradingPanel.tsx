"use client";

import { useState } from "react";
import { Sparkles, Check, X, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

type AIGradeData = {
  suggestedScore: number;
  confidence: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedBreakdown: {
    contentAccuracy: number;
    completeness: number;
    clarity: number;
    relevance: number;
  };
};

type AIGradingPanelProps = {
  question: string;
  studentAnswer: string;
  modelAnswer?: string;
  rubric?: string;
  questionType: string;
  currentScore: number;
  currentNotes: string;
  onAccept: (score: number, notes: string) => void;
  onEdit: (score: number, notes: string) => void;
};

export default function AIGradingPanel({
  question,
  studentAnswer,
  modelAnswer,
  rubric,
  questionType,
  currentScore,
  currentNotes,
  onAccept,
  onEdit,
}: AIGradingPanelProps) {
  const [aiGrade, setAiGrade] = useState<AIGradeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editScore, setEditScore] = useState(currentScore);
  const [editNotes, setEditNotes] = useState(currentNotes);

  async function getAIGrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/ai-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          studentAnswer,
          modelAnswer,
          rubric,
          questionType,
          maxScore: 100,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI grading failed");
      }

      const data = await res.json();
      setAiGrade(data);
      setEditScore(data.suggestedScore);
      setEditNotes(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI grade");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (aiGrade) {
      onAccept(aiGrade.suggestedScore, aiGrade.feedback);
    }
  }

  function handleSaveEdit() {
    onEdit(editScore, editNotes);
    setEditMode(false);
  }

  // Confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-emerald-400 bg-emerald-500/20";
    if (confidence >= 60) return "text-sky-400 bg-sky-500/20";
    if (confidence >= 40) return "text-amber-400 bg-amber-500/20";
    return "text-rose-400 bg-rose-500/20";
  };

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-sky-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  // Score comparison
  const scoreDiff = aiGrade ? aiGrade.suggestedScore - currentScore : 0;
  const DiffIcon = scoreDiff > 0 ? TrendingUp : scoreDiff < 0 ? TrendingDown : Minus;

  if (!aiGrade && !loading && !error) {
    return (
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg mb-1">AI-Assisted Grading</h3>
            <p className="text-sm text-slate-300 mb-4">
              Get an AI-suggested grade with detailed feedback, strengths analysis, and improvement recommendations.
              You can accept it as-is or use it as a starting point for your own assessment.
            </p>
            <button
              onClick={getAIGrade}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-violet-500/50 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Get AI Grade Suggestion
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin"></div>
            <Sparkles className="w-6 h-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="font-bold text-white mb-1">AI is analyzing the answer...</p>
            <p className="text-xs text-slate-400">This may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-rose-300 mb-1">AI Grading Failed</h3>
            <p className="text-sm text-rose-400 mb-4">{error}</p>
            {error.includes("not configured") && (
              <div className="rounded-lg bg-rose-950/50 border border-rose-500/20 p-3 mb-4">
                <p className="text-xs text-rose-300 font-mono">
                  Add to .env file: <span className="text-rose-200">OPENAI_API_KEY=sk-...</span>
                </p>
              </div>
            )}
            <button
              onClick={getAIGrade}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!aiGrade) return null;

  return (
    <div className="space-y-4">
      {/* AI Grade Summary Card */}
      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">AI Suggested Grade</h3>
              <p className="text-xs text-slate-400">Powered by GPT-4</p>
            </div>
          </div>
          
          {/* Confidence Badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${getConfidenceColor(aiGrade.confidence)}`}>
            {aiGrade.confidence}% Confidence
          </div>
        </div>

        {/* Score Comparison */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Current Score</p>
            <p className={`text-3xl font-extrabold ${getScoreColor(currentScore)}`}>{currentScore}</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <DiffIcon className={`w-6 h-6 mb-1 ${scoreDiff > 0 ? 'text-emerald-400' : scoreDiff < 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              <p className="text-xs text-slate-400">
                {scoreDiff > 0 ? '+' : ''}{scoreDiff} points
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">AI Suggested</p>
            <p className={`text-3xl font-extrabold ${getScoreColor(aiGrade.suggestedScore)}`}>{aiGrade.suggestedScore}</p>
          </div>
        </div>

        {/* Feedback */}
        <div className="rounded-lg bg-slate-950/50 border border-slate-700 p-4 mb-4">
          <p className="text-xs text-slate-400 uppercase font-bold mb-2">AI Feedback</p>
          <p className="text-sm text-slate-200 leading-relaxed">{aiGrade.feedback}</p>
        </div>

        {/* Action Buttons */}
        {!editMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all inline-flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Accept AI Grade
            </button>
            <button
              onClick={() => setEditMode(true)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all"
            >
              Edit & Save
            </button>
            <button
              onClick={getAIGrade}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all"
              title="Re-grade with AI"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detailed Breakdown */}
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-5">
        <h4 className="text-sm font-bold text-white mb-4">Detailed Assessment Breakdown</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(aiGrade.detailedBreakdown).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className={`text-sm font-bold ${getScoreColor(value)}`}>{value}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    value >= 80 ? 'bg-emerald-500' :
                    value >= 60 ? 'bg-sky-500' :
                    value >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Strengths
          </h4>
          <ul className="space-y-2">
            {aiGrade.strengths.map((strength, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h4 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Areas to Improve
          </h4>
          <ul className="space-y-2">
            {aiGrade.improvements.map((improvement, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">→</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Edit Mode */}
      {editMode && (
        <div className="rounded-xl border border-violet-500/30 bg-slate-900/80 p-6 space-y-4">
          <h4 className="text-sm font-bold text-white mb-4">Edit Grade</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-2">
                Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={editScore}
                onChange={(e) => setEditScore(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <div className={`text-center p-4 rounded-lg bg-slate-800 flex-1`}>
                <p className="text-xs text-slate-400 mb-1">Preview</p>
                <p className={`text-3xl font-extrabold ${getScoreColor(editScore)}`}>{editScore}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold block mb-2">
              Feedback Notes
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-violet-500 focus:outline-none resize-none"
              placeholder="Add your feedback..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
            >
              Save Grade
            </button>
            <button
              onClick={() => {
                setEditMode(false);
                setEditScore(aiGrade.suggestedScore);
                setEditNotes(aiGrade.feedback);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
