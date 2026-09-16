"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Edit2, Save, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

/**
 * Teacher Review Page - Individual Test Review
 * Side-by-side comparison of student answers with AI grading
 * Allow teacher to modify scores and approve/reject
 */

type TestDetail = {
  id: string;
  student: {
    name: string;
    email: string;
  };
  trade: string;
  level: string;
  status: string;
  totalPoints: number;
  objectiveScore: number;
  subjectiveScore: number;
  scoredPoints: number;
  percentage: number;
  passingScore: number;
  submittedAt: string;
  duration: number;
  responses: Array<{
    id: string;
    questionId: string;
    questionType: string;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string | null;
    isCorrect: boolean | null;
    pointsAwarded: number;
    maxPoints: number;
    rubric: string | null;
    aiScore: number | null;
    feedback: string | null;
    subjectiveGrading: {
      id: string;
      aiScore: number;
      aiFeedback: string;
      aiStrengths: string;
      aiImprovements: string;
      teacherScore: number | null;
      teacherFeedback: string | null;
    } | null;
  }>;
};

export default function TeacherReviewTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;

  const [testDetail, setTestDetail] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});
  const [editingFeedback, setEditingFeedback] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState('');
  const [finalDecision, setFinalDecision] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    if (testId) {
      fetchTestDetail();
    }
  }, [testId]);

  const fetchTestDetail = async () => {
    try {
      const res = await fetch(`/api/teacher/entrance-tests/${testId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch test');
      }
      const data = await res.json();
      setTestDetail(data.test);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch test detail:', error);
      setLoading(false);
    }
  };

  const handleScoreEdit = (responseId: string, newScore: number) => {
    setEditingScores((prev) => ({
      ...prev,
      [responseId]: newScore
    }));
  };

  const handleFeedbackEdit = (responseId: string, newFeedback: string) => {
    setEditingFeedback((prev) => ({
      ...prev,
      [responseId]: newFeedback
    }));
  };

  const handleSaveReview = async (decision: 'approved' | 'rejected') => {
    if (!testDetail) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/entrance-tests/${testId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reviewNotes,
          scoreModifications: editingScores,
          feedbackModifications: editingFeedback
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save review');
      }

      alert(`Test ${decision}! Marks will be released to student.`);
      router.push('/teacher/entrance-tests');
    } catch (error: any) {
      alert(error.message);
      setSaving(false);
    }
  };

  const calculateAdjustedScore = () => {
    if (!testDetail) return 0;

    let total = testDetail.scoredPoints;

    // Apply modifications
    Object.entries(editingScores).forEach(([responseId, newScore]) => {
      const response = testDetail.responses.find(r => r.id === responseId);
      if (response) {
        total = total - response.pointsAwarded + newScore;
      }
    });

    return total;
  };

  const adjustedScore = calculateAdjustedScore();
  const adjustedPercentage = testDetail ? (adjustedScore / testDetail.totalPoints) * 100 : 0;
  const willPass = adjustedPercentage >= (testDetail?.passingScore || 60);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (!testDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Test Not Found</h2>
          <Link href="/teacher/entrance-tests" className="text-blue-400 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/entrance-tests"
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{testDetail.student.name}</h1>
            <p className="text-slate-400">{testDetail.student.email}</p>
          </div>
        </div>

        {/* Test Summary Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Trade</p>
              <p className="text-lg font-semibold text-white">
                {testDetail.trade.replace(/-/g, ' ').toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Level</p>
              <p className="text-lg font-semibold text-white">
                {testDetail.level.replace('l', 'Level ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Original Score</p>
              <p className="text-lg font-semibold text-white">
                {testDetail.percentage.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-400">
                {testDetail.scoredPoints.toFixed(1)} / {testDetail.totalPoints}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Adjusted Score</p>
              <p className={`text-lg font-semibold ${willPass ? 'text-green-400' : 'text-red-400'}`}>
                {adjustedPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-400">
                {adjustedScore.toFixed(1)} / {testDetail.totalPoints}
              </p>
            </div>
          </div>

          {/* Pass/Fail Indicator */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            {willPass ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  Meets passing score ({testDetail.passingScore}%)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">
                  Below passing score ({testDetail.passingScore}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Responses Review */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Question Responses</h2>

          {testDetail.responses.map((response, index) => (
            <div key={response.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-slate-400">Q{index + 1}</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                      {response.questionType.toUpperCase()}
                    </span>
                    {response.isCorrect !== null && (
                      <span className={`text-xs px-2 py-1 rounded ${response.isCorrect
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}>
                        {response.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    )}
                  </div>
                  <p className="text-white font-medium">{response.questionText}</p>
                </div>
              </div>

              {/* Student Answer */}
              <div className="mb-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Student Answer:</p>
                <p className="text-white whitespace-pre-wrap">
                  {(() => {
                    try {
                      const parsed = JSON.parse(response.studentAnswer);
                      if (Array.isArray(parsed)) return parsed.join(', ');
                      if (typeof parsed === 'object') return JSON.stringify(parsed, null, 2);
                      return parsed || '(No answer)';
                    } catch {
                      return response.studentAnswer || '(No answer)';
                    }
                  })()}
                </p>
              </div>

              {/* Correct Answer (for objective) */}
              {response.correctAnswer && (
                <div className="mb-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-sm text-green-400 mb-2">Correct Answer:</p>
                  <p className="text-green-300">
                    {(() => {
                      try {
                        const parsed = JSON.parse(response.correctAnswer);
                        if (Array.isArray(parsed)) return parsed.join(', ');
                        return parsed;
                      } catch {
                        return response.correctAnswer;
                      }
                    })()}
                  </p>
                </div>
              )}

              {/* AI Grading (for subjective) */}
              {response.subjectiveGrading && (
                <div className="mb-4 space-y-3">
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <p className="text-sm text-purple-400 mb-2">AI Feedback:</p>
                    <p className="text-purple-200 mb-3">{response.subjectiveGrading.aiFeedback}</p>
                    {response.subjectiveGrading.aiStrengths && (
                      <div className="mb-2">
                        <p className="text-xs text-green-400 mb-1">Strengths:</p>
                        <p className="text-sm text-green-300">{response.subjectiveGrading.aiStrengths}</p>
                      </div>
                    )}
                    {response.subjectiveGrading.aiImprovements && (
                      <div>
                        <p className="text-xs text-yellow-400 mb-1">Areas for Improvement:</p>
                        <p className="text-sm text-yellow-300">{response.subjectiveGrading.aiImprovements}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Score Editing */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-700">
                <div className="flex-1">
                  <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                    <Edit2 className="w-3 h-3" />
                    Adjust Score (Teacher Override):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={response.maxPoints}
                      step={0.5}
                      value={editingScores[response.id] ?? response.pointsAwarded}
                      onChange={(e) => handleScoreEdit(response.id, parseFloat(e.target.value))}
                      className="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-400">/ {response.maxPoints}</span>
                    {editingScores[response.id] !== undefined &&
                      editingScores[response.id] !== response.pointsAwarded && (
                        <span className="text-sm text-yellow-400 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          Modified
                        </span>
                      )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {response.isCorrect !== null
                      ? "✓ AI auto-graded. You can override the score if needed."
                      : "Enter your score for this question."}
                  </p>
                </div>

                {response.subjectiveGrading && (
                  <div className="flex-1">
                    <label className="text-sm text-slate-400 mb-2 block">Teacher Feedback:</label>
                    <input
                      type="text"
                      value={editingFeedback[response.id] ?? response.subjectiveGrading.teacherFeedback ?? ''}
                      onChange={(e) => handleFeedbackEdit(response.id, e.target.value)}
                      placeholder="Add your feedback..."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Final Review Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Final Review</h2>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Review Notes (optional):</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any notes or comments for the student..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleSaveReview('approved')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              Approve & Release Marks
            </button>
            <button
              onClick={() => handleSaveReview('rejected')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Reject & Release Marks
            </button>
          </div>

          {!willPass && (
            <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-semibold">Warning</p>
                <p className="text-yellow-300 text-sm mt-1">
                  This student's score is below the passing threshold. Approving will grant them access despite not meeting the requirement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
