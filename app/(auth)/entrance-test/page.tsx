"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import EntranceTestInterface from '@/components/EntranceTestInterface';

/**
 * Entrance Test Page - Shows status or launches test
 */
export default function EntranceTestPage() {
  const router = useRouter();
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntranceTest();
  }, []);

  const fetchEntranceTest = async () => {
    try {
      const res = await fetch('/api/entrance-test/get');
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setError('No entrance test assigned. Please contact administration.');
        } else if (res.status === 401) {
          router.push('/auth/login');
          return;
        } else {
          setError(data.error || 'Failed to load entrance test');
        }
        setLoading(false);
        return;
      }

      setTestData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch entrance test:', err);
      setError('Failed to load entrance test');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
          <p className="text-white text-lg">Loading entrance test...</p>
        </div>
      </div>
    );
  }

  if (error || !testData?.hasTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-md w-full text-center space-y-4">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">No Test Available</h1>
          <p className="text-slate-300">{error || 'No entrance test found for your account.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Test already completed
  if (testData.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 max-w-3xl w-full space-y-6">
          {/* Status Badge */}
          <div className="text-center">
            {testData.status === 'submitted' || testData.status === 'under_review' ? (
              <>
                <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                <h1 className="text-2xl font-bold text-white mb-2">Test Under Review</h1>
                <p className="text-slate-300">Your entrance test is being reviewed by teachers.</p>
                <p className="text-sm text-slate-400 mt-2">You will be notified when marks are released.</p>
              </>
            ) : testData.finalStatus === 'approved' ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">🎉 Congratulations!</h1>
                <p className="text-slate-300 text-lg">You have passed the entrance test!</p>
                <p className="text-sm text-slate-400 mt-2">You now have access to the platform.</p>
              </>
            ) : testData.finalStatus === 'rejected' ? (
              <>
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Test Not Passed</h1>
                <p className="text-slate-300">Unfortunately, you did not meet the passing criteria this time.</p>
                <p className="text-sm text-slate-400 mt-2">Please review the feedback below and contact your instructor for guidance.</p>
              </>
            ) : null}
          </div>

          {/* Results - Only show if marks released */}
          {testData.marksReleasedAt && (
            <>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Your Results</h2>
                  <span className="text-xs text-slate-400">
                    Released: {new Date(testData.marksReleasedAt).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Total Score</p>
                    <p className="text-2xl font-bold text-white">
                      {testData.scoredPoints?.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400">out of {testData.totalPoints}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Percentage</p>
                    <p className={`text-2xl font-bold ${testData.finalStatus === 'approved' ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {testData.percentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Objective</p>
                    <p className="text-lg font-bold text-blue-400">
                      {testData.objectiveScore?.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400">out of {testData.objectivePoints}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Subjective</p>
                    <p className="text-lg font-bold text-purple-400">
                      {testData.subjectiveScore?.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-400">out of {testData.subjectivePoints}</p>
                  </div>
                </div>

                {/* Passing threshold indicator */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Passing Score</span>
                    <span className="text-sm font-semibold text-slate-300">{testData.passingScore}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${(testData.percentage || 0) >= testData.passingScore
                        ? 'bg-green-500'
                        : 'bg-red-500'
                        }`}
                      style={{ width: `${Math.min((testData.percentage || 0), 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Teacher Feedback */}
              {testData.reviewNotes && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-400 mb-2">Teacher Feedback</h3>
                      <p className="text-sm text-blue-200 whitespace-pre-wrap">{testData.reviewNotes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Response Review Link */}
              {testData.responses && testData.responses.length > 0 && (
                <button
                  onClick={() => router.push('/entrance-test/results')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  View Detailed Question-by-Question Feedback
                </button>
              )}
            </>
          )}

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Test pending - show start interface
  return <EntranceTestInterface testData={testData.test} onComplete={() => fetchEntranceTest()} />;
}
