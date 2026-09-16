"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Filter, Search } from 'lucide-react';
import Link from 'next/link';

/**
 * Teacher Dashboard - Entrance Test Review
 * Lists all submitted entrance tests for review
 * 
 * DEPARTMENT-SPECIFIC:
 * - Trainers see only tests from their assigned department
 * - Admins see all tests
 */

type EntranceTestSummary = {
  id: string;
  student: {
    name: string;
    email: string;
  };
  trade: string;
  level: string;
  status: string;
  percentage: number;
  totalPoints: number;
  scoredPoints: number;
  submittedAt: string;
  aiGradedAt: string | null;
  needsReview: boolean;
  subjectiveCount: number;
};

export default function TeacherEntranceTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<EntranceTestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntranceTests();
  }, [filter]);

  const fetchEntranceTests = async () => {
    try {
      const res = await fetch(`/api/teacher/entrance-tests/list?filter=${filter}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        if (res.status === 403) {
          const data = await res.json();
          setError(data.message || 'Access denied');
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch tests');
      }
      const data = await res.json();
      setTests(data.tests || []);
      setDepartment(data.department || null);
      setIsAdmin(data.isAdmin || false);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch entrance tests:', error);
      setError('Failed to load entrance tests');
      setLoading(false);
    }
  };

  const filteredTests = tests.filter((test) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      test.student.name.toLowerCase().includes(query) ||
      test.student.email.toLowerCase().includes(query) ||
      test.trade.toLowerCase().includes(query)
    );
  });

  const pendingCount = tests.filter(t => t.status === 'under_review' || t.status === 'submitted').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading entrance tests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="bg-slate-800 rounded-xl border border-red-500/30 p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-300">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Entrance Test Review</h1>
            <p className="text-slate-400 mt-1">
              {isAdmin ? 'Review and approve student entrance tests from all departments' : `Review tests for ${department?.replace(/-/g, ' ')}`}
            </p>
          </div>
          <div className="flex gap-3">
            {/* Department Badge */}
            {department && !isAdmin && (
              <div className="bg-blue-500/20 border border-blue-500 rounded-lg px-4 py-2">
                <span className="text-blue-400 font-semibold text-sm">
                  Department: {department.replace(/-/g, ' ').toUpperCase()}
                </span>
              </div>
            )}
            {isAdmin && (
              <div className="bg-purple-500/20 border border-purple-500 rounded-lg px-4 py-2">
                <span className="text-purple-400 font-semibold text-sm">
                  Admin: All Departments
                </span>
              </div>
            )}
            {/* Pending Count */}
            {pendingCount > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2">
                <span className="text-yellow-400 font-semibold text-sm">{pendingCount} pending review</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                All ({tests.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('reviewed')}
                className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'reviewed'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                Reviewed
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or trade..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tests List */}
        {filteredTests.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tests found</h3>
            <p className="text-slate-400">
              {filter === 'pending'
                ? 'No tests pending review'
                : searchQuery
                  ? 'No tests match your search'
                  : 'No entrance tests submitted yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition"
              >
                <div className="flex items-start justify-between">
                  {/* Student Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{test.student.name}</h3>
                      <span className="text-sm text-slate-400">{test.student.email}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                        {test.trade.replace(/-/g, ' ').toUpperCase()}
                      </span>
                      <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                        Level {test.level.replace('l', '')}
                      </span>
                      {test.status === 'under_review' && (
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Needs Review
                        </span>
                      )}
                      {test.status === 'approved' && (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Approved
                        </span>
                      )}
                      {test.status === 'rejected' && (
                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score and Action */}
                  <div className="text-right space-y-2">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {test.percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        {test.scoredPoints.toFixed(1)} / {test.totalPoints}
                      </div>
                    </div>
                    <Link
                      href={`/teacher/entrance-tests/${test.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      Review
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span>Submitted: {new Date(test.submittedAt).toLocaleString()}</span>
                  {test.aiGradedAt && (
                    <span>AI Graded: {new Date(test.aiGradedAt).toLocaleString()}</span>
                  )}
                  {test.subjectiveCount > 0 && (
                    <span>{test.subjectiveCount} subjective question{test.subjectiveCount > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
