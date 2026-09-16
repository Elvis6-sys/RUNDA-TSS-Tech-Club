"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Download, Clock, AlertTriangle, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

/**
 * Student Entrance Test Results Page
 * Shows released results with detailed breakdown
 * Allows downloading results as PDF
 */

type TestResult = {
  id: string;
  trade: string;
  level: string;
  status: string;
  totalPoints: number;
  scoredPoints: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
  objectiveScore: number;
  objectivePoints: number;
  subjectiveScore: number;
  subjectivePoints: number;
  responses: Array<{
    id: string;
    questionText: string;
    questionType: string;
    studentAnswer: string;
    correctAnswer: string | null;
    isCorrect: boolean | null;
    pointsAwarded: number;
    maxPoints: number;
    feedback: string | null;
    subjectiveGrading: {
      aiScore: number;
      aiFeedback: string;
      teacherScore: number | null;
      teacherFeedback: string | null;
    } | null;
  }>;
};

export default function EntranceTestResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/entrance-test/results');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (res.status === 404) {
          setError('No entrance test found');
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch results');
      }
      const data = await res.json();

      // Only show if marks are released (status approved or rejected)
      if (data.test.status !== 'approved' && data.test.status !== 'rejected') {
        setError('Results not yet released');
        setLoading(false);
        return;
      }

      setResult(data.test);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setError('Failed to load results');
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;

    setDownloading(true);
    try {
      const res = await fetch(`/api/entrance-test/results/download`);
      if (!res.ok) {
        throw new Error('Download failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entrance-test-results-${result.id}.html`; // Changed to .html
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Show success message
      alert('Results downloaded! Open the HTML file in your browser and use Print → Save as PDF to create a PDF.');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download results');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="bg-slate-800 rounded-xl border border-yellow-500/30 p-8 max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {error === 'Results not yet released' ? 'Results Pending' : 'No Results'}
          </h2>
          <p className="text-slate-300 mb-6">
            {error === 'Results not yet released'
              ? 'Your entrance test is under review. Results will be available once a teacher approves and releases your marks.'
              : error || 'No entrance test results found'}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Entrance Test Results</h1>
              <p className="text-slate-400 mt-1">
                {result.trade.replace(/-/g, ' ').toUpperCase()} - Level {result.level.replace('l', '')}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Results
              </>
            )}
          </button>
        </div>

        {/* Result Status Card */}
        <div className={`rounded-xl border-2 p-8 ${result.passed
          ? 'bg-green-500/10 border-green-500'
          : 'bg-red-500/10 border-red-500'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {result.passed ? (
                <CheckCircle className="w-16 h-16 text-green-400" />
              ) : (
                <XCircle className="w-16 h-16 text-red-400" />
              )}
              <div>
                <h2 className={`text-3xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {result.passed ? 'Congratulations!' : 'Not Passed'}
                </h2>
                <p className="text-lg text-white mt-1">
                  You scored <span className="font-bold">{result.percentage.toFixed(1)}%</span>
                </p>
                <p className="text-sm text-slate-300">
                  Passing score: {result.passingScore}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-white">
                {result.scoredPoints.toFixed(1)}
              </div>
              <div className="text-xl text-slate-300">
                out of {result.totalPoints}
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Objective Questions</h3>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Multiple Choice, True/False, etc.</span>
              <span className="text-2xl font-bold text-white">
                {result.objectiveScore.toFixed(1)} / {result.objectivePoints}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {((result.objectiveScore / result.objectivePoints) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Subjective Questions</h3>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Short Answer, Essays, Code</span>
              <span className="text-2xl font-bold text-white">
                {result.subjectiveScore.toFixed(1)} / {result.subjectivePoints}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {((result.subjectiveScore / result.subjectivePoints) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Teacher Review Notes */}
        {result.reviewNotes && (
          <div className="bg-blue-500/10 border border-blue-500 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Teacher's Notes</h3>
                <p className="text-white whitespace-pre-wrap">{result.reviewNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Question Breakdown */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Question-by-Question Breakdown</h2>

          {result.responses.map((response, index) => (
            <div key={response.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-slate-400">Question {index + 1}</span>
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
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-white">
                    {response.pointsAwarded.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-400">
                    / {response.maxPoints}
                  </div>
                </div>
              </div>

              {/* Your Answer */}
              <div className="mb-3 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-2">Your Answer:</p>
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
                <div className="mb-3 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
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

              {/* Feedback */}
              {(response.feedback || response.subjectiveGrading) && (
                <div className="space-y-2">
                  {response.subjectiveGrading?.teacherFeedback && (
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <p className="text-sm text-blue-400 mb-2">Teacher's Feedback:</p>
                      <p className="text-blue-200">{response.subjectiveGrading.teacherFeedback}</p>
                    </div>
                  )}
                  {response.subjectiveGrading?.aiFeedback && !response.subjectiveGrading?.teacherFeedback && (
                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <p className="text-sm text-purple-400 mb-2">Feedback:</p>
                      <p className="text-purple-200">{response.subjectiveGrading.aiFeedback}</p>
                    </div>
                  )}
                  {response.feedback && !response.subjectiveGrading && (
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-300">{response.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Test Metadata */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Test Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Submitted:</span>
              <span className="text-white ml-2">{new Date(result.submittedAt).toLocaleString()}</span>
            </div>
            {result.reviewedAt && (
              <div>
                <span className="text-slate-400">Reviewed:</span>
                <span className="text-white ml-2">{new Date(result.reviewedAt).toLocaleString()}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Status:</span>
              <span className={`ml-2 font-semibold ${result.status === 'approved' ? 'text-green-400' : 'text-red-400'
                }`}>
                {result.status === 'approved' ? 'Approved' : 'Rejected'}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {result.passed ? (
          <div className="bg-green-500/10 border border-green-500 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-2">🎉 Next Steps</h3>
            <p className="text-white">
              You've successfully passed the entrance test! You now have full access to the platform.
              Start exploring the curriculum and begin your learning journey.
            </p>
            <Link
              href="/passport"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
            >
              Start Learning
            </Link>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">What's Next?</h3>
            <p className="text-white">
              Don't be discouraged! Review the feedback above and consider the areas for improvement.
              Contact your instructor if you have questions about your results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
