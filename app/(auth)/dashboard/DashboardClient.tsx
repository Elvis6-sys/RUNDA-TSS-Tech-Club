"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Trophy, Calendar, Moon, BookOpen, BarChart3,
  Target, Clock, TrendingUp, Sun, ChevronRight
} from "lucide-react";

type DashboardData = {
  profile: { id: string; name: string | null; role: string; xp: number };
  entranceTestCompleted?: boolean; // Flag for showing results banner
  lastLesson: {
    lessonId: string;
    title: string;
    subject: string;
    completedAt: string | null;
    lastReadAt: string;
  } | null;
  subjectSummary: {
    subject: string;
    total: number;
    completed: number;
    pct: number;
    remaining: number;
  } | null;
  streak: { current: number; longest: number; lastActivityDate: string | null };
  upcomingEvents: { id: string; title: string; date: string; type: string }[];
  adminStats: {
    pendingCount: number;
    totalMembers: number;
    lessonsCompleted: number;
    pendingApplications: {
      user: { id: string; name: string | null; email: string; role: string; school: string | null };
    }[];
  } | null;
};

const EVENT_COLOR_LIGHT: Record<string, string> = {
  holiday_intensive: "bg-sky-50 text-sky-700 border-sky-200",
  demo_day: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mentorship: "bg-purple-50 text-purple-700 border-purple-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

const EVENT_COLOR_DARK: Record<string, string> = {
  holiday_intensive: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  demo_day: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  mentorship: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  other: "bg-slate-700/60 text-slate-400 border-slate-600/30",
};

/* ── Points ring widget ────────────────────────────────────────────── */
function PointsRing({ points }: { points: number }) {
  const level = Math.floor(points / 100) + 1;
  const pct = points % 100;
  const r = 20;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative h-16 w-16">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke="url(#xpGrad)"
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold text-blue-600 leading-none">Lv{level}</span>
        <span className="text-[9px] text-slate-500 leading-none">{points} pts</span>
      </div>
    </div>
  );
}

/* ── Dashboard page ────────────────────────────────────────────── */
export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentImage, setCurrentImage] = useState(0);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
  }, []);

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Hero images based on user role
  const heroImages = data?.profile?.role === 'trainer' || data?.profile?.role === 'admin'
    ? [
      "/images/teacher-instruction.jpg",
      "/images/teacher-demo.jpg",
      "/images/teacher-workstation.jpg"
    ]
    : [
      "/images/student-lab.jpg",
      "/images/student-group.jpg",
      "/images/student-studying.jpg"
    ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const [accountStatus, setAccountStatus] = useState<'pending_review' | 'rejected' | 'entrance_test_required' | 'entrance_test_in_progress' | 'entrance_test_under_review' | 'awaiting_marks_release' | 'entrance_test_rejected' | 'entrance_test_incomplete' | null>(null);
  const [pendingUserInfo, setPendingUserInfo] = useState<{ name: string | null, email: string, id?: string, role?: string } | null>(null);

  useEffect(() => {
    // Add timeout to prevent hanging forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    fetch("/api/dashboard", { signal: controller.signal })
      .then((r) => {
        clearTimeout(timeoutId);
        return r.json();
      })
      .then((d) => {
        // Check for entrance test gates
        if (d.status === "entrance_test_required" ||
          d.status === "entrance_test_in_progress" ||
          d.status === "entrance_test_under_review" ||
          d.status === "awaiting_marks_release" ||
          d.status === "entrance_test_rejected" ||
          d.status === "entrance_test_incomplete") {
          setAccountStatus(d.status);
          setPendingUserInfo(d.profile);
          setLoading(false);
        } else if (d.status === "pending_review" || d.status === "rejected") {
          setAccountStatus(d.status);
          setPendingUserInfo(d.profile);
          setLoading(false);
        } else {
          setData(d);
          setLoading(false);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error('Dashboard API error:', err);
        setLoading(false);
      });
  }, []);

  // Theme-based styles matching landing page
  const styles = {
    light: {
      bg: "bg-slate-50",
      mainText: "text-slate-900",
      subText: "text-slate-600",
      card: "bg-white border-slate-200",
      cardHover: "hover:shadow-md hover:border-blue-200",
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-white border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-slate-50",
      badge: "bg-blue-50 border-blue-200 text-blue-700",
      statCard: "bg-white border-slate-200 shadow-sm",
      progressBar: "bg-slate-200",
      progressFill: "bg-blue-600",
      iconBg: "bg-blue-50 border-blue-100",
      iconText: "text-blue-600",
      eventColors: EVENT_COLOR_LIGHT,
    },
    dark: {
      bg: "bg-slate-900",
      mainText: "text-white",
      subText: "text-slate-300",
      card: "bg-slate-800/50 border-slate-700",
      cardHover: "hover:shadow-xl hover:shadow-blue-500/10 hover:border-slate-600",
      primary: "bg-blue-500 hover:bg-blue-600 text-white",
      secondary: "bg-slate-800 border-slate-600 text-slate-100 hover:border-blue-500 hover:bg-slate-700",
      badge: "bg-blue-500/10 border-blue-500/30 text-blue-300",
      statCard: "bg-slate-800/50 border-slate-700 shadow-sm",
      progressBar: "bg-slate-700",
      progressFill: "bg-blue-500",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      iconText: "text-blue-400",
      eventColors: EVENT_COLOR_DARK,
    }
  };

  const currentStyles = styles[theme];

  /* Loading skeleton */
  if (loading) {
    return (
      <main className={`min-h-screen ${currentStyles.bg} transition-colors duration-300 px-4 py-6`}>
        <div className="mx-auto max-w-7xl space-y-6">
          <div className={`h-32 rounded-2xl ${currentStyles.card} border animate-pulse backdrop-blur-sm`} />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`h-96 rounded-2xl ${currentStyles.card} border animate-pulse backdrop-blur-sm`} />
            <div className={`h-96 rounded-2xl ${currentStyles.card} border animate-pulse backdrop-blur-sm`} />
          </div>
        </div>
      </main>
    );
  }

  /* Pending Approval State */
  if (accountStatus === "pending_review") {
    const firstName = pendingUserInfo?.name?.split(" ")[0] || "there";
    return (
      <main className={`min-h-screen flex items-center justify-center px-4 py-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950' : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'}`}>
        {/* Animated background blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-300'}`} />
          <div className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse delay-1000 ${theme === 'dark' ? 'bg-purple-600' : 'bg-purple-300'}`} />
        </div>

        <div className={`max-w-lg w-full rounded-3xl border shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'}`}>

          {/* Top banner */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center mb-4 shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Under Review</h2>
            <p className="text-blue-100 text-sm mt-1">Your application is being processed</p>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* Greeting */}
            <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
              <p className={`text-base leading-relaxed ${currentStyles.mainText}`}>
                👋 Hey <span className="font-bold text-blue-500">{firstName}</span>! Thanks for joining RUNDA TSS Tech Club.
                Your account is currently <span className="font-semibold">under review</span> by our admin team.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {[
                { icon: "✅", label: "Registration submitted", done: true },
                { icon: "🔍", label: "Admin reviewing your account", done: true, active: true },
                { icon: "🚀", label: "Access granted to dashboard", done: false },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${step.active
                  ? theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                  : step.done
                    ? theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
                    : theme === 'dark' ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <span className="text-xl">{step.icon}</span>
                  <span className={`text-sm font-medium ${step.active
                    ? theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
                    : step.done
                      ? theme === 'dark' ? 'text-green-300' : 'text-green-700'
                      : currentStyles.subText
                    }`}>{step.label}</span>
                  {step.active && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-medium animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Email */}
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'}`}>
                <span className="text-base">📧</span>
              </div>
              <div>
                <p className={`text-xs ${currentStyles.subText}`}>Registered Email</p>
                <p className={`text-sm font-semibold ${currentStyles.mainText}`}>{pendingUserInfo?.email}</p>
              </div>
            </div>

            {/* Timeline hint */}
            <p className={`text-center text-xs ${currentStyles.subText}`}>
              ⏱️ Approval usually takes <span className="font-semibold">1–2 business days</span>
            </p>

            {/* Contact */}
            <div className={`rounded-xl border p-3 text-center ${theme === 'dark' ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs ${currentStyles.subText}`}>Need help? Contact your administrator</p>
              <a
                href="mailto:leotuyi10@gmail.com"
                className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
              >
                leotuyi10@gmail.com
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* Rejected State */
  if (accountStatus === "rejected") {
    return (
      <main className={`min-h-screen ${currentStyles.bg} transition-colors duration-300 flex items-center justify-center px-4 py-6`}>
        <div className={`max-w-md w-full rounded-2xl border border-red-200 dark:border-red-500/30 ${theme === 'light' ? 'bg-red-50' : 'bg-red-500/5'} p-8 shadow-xl backdrop-blur-sm text-center space-y-6`}>
          <div className={`mx-auto w-16 h-16 rounded-full ${theme === 'light' ? 'bg-red-100 border-red-200' : 'bg-red-500/10 border-red-500/20'} border-2 flex items-center justify-center`}>
            <Target className={`w-8 h-8 ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`} />
          </div>
          <div className="space-y-3">
            <h2 className={`text-2xl font-bold ${currentStyles.mainText}`}>
              Application Not Approved
            </h2>
            <p className={`${currentStyles.subText} leading-relaxed`}>
              Unfortunately, your account application was not approved at this time.
            </p>
            <p className={`${currentStyles.subText} leading-relaxed`}>
              If you believe this is an error, please contact the administrator for more information.
            </p>
          </div>
          <div className={`rounded-xl ${currentStyles.statCard} border p-4`}>
            <p className={`text-sm ${currentStyles.subText} mb-2`}>Registered Email</p>
            <p className={`font-semibold ${currentStyles.mainText}`}>{pendingUserInfo?.email}</p>
          </div>
          <p className={`text-xs ${currentStyles.subText} opacity-70`}>
            Contact: leotuyi10@gmail.com
          </p>
        </div>
      </main>
    );
  }

  /* Entrance Test Required - First Login */
  if (accountStatus === "entrance_test_required" || accountStatus === "entrance_test_in_progress") {
    const firstName = pendingUserInfo?.name?.split(" ")[0] || "Student";
    return (
      <main className={`min-h-screen flex items-center justify-center px-4 py-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950' : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'}`}>
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${theme === 'dark' ? 'bg-purple-600' : 'bg-purple-300'}`} />
          <div className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse delay-1000 ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-300'}`} />
        </div>

        <div className={`max-w-lg w-full rounded-3xl border shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'}`}>
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center mb-4 shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Entrance Test Required</h2>
            <p className="text-purple-100 text-sm mt-1">Complete the test to join the club</p>
          </div>

          <div className="px-8 py-6 space-y-5">
            <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-100'}`}>
              <p className={`text-base leading-relaxed ${currentStyles.mainText}`}>
                🎓 Hey <span className="font-bold text-purple-500">{firstName}</span>! Your account has been approved.
                Before you can access the full app, you need to <span className="font-semibold">complete the entrance test</span>.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: "✅", label: "Account approved by admin", done: true },
                { icon: "📝", label: "Take entrance test", done: false, active: true },
                { icon: "🎯", label: "AI grades your test", done: false },
                { icon: "👨‍🏫", label: "Teacher reviews & releases marks", done: false },
                { icon: "🚀", label: "Full access granted", done: false },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${step.active
                  ? theme === 'dark' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
                  : step.done
                    ? theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
                    : theme === 'dark' ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <span className="text-xl">{step.icon}</span>
                  <span className={`text-sm font-medium ${step.active
                    ? theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                    : step.done
                      ? theme === 'dark' ? 'text-green-300' : 'text-green-700'
                      : currentStyles.subText
                    }`}>{step.label}</span>
                  {step.active && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-500 text-white font-medium animate-pulse">
                      Now
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/entrance-test"
              className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all text-center shadow-lg"
            >
              {accountStatus === "entrance_test_in_progress" ? "Continue Test" : "Start Entrance Test"}
            </Link>

            <p className={`text-center text-xs ${currentStyles.subText}`}>
              ⏱️ The test is based on your <span className="font-semibold">{pendingUserInfo?.role?.toUpperCase()} curriculum</span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* Test Submitted - Under Review */
  if (accountStatus === "entrance_test_under_review") {
    const firstName = pendingUserInfo?.name?.split(" ")[0] || "Student";
    return (
      <main className={`min-h-screen flex items-center justify-center px-4 py-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950' : 'bg-gradient-to-br from-amber-50 via-white to-yellow-50'}`}>
        <div className={`max-w-lg w-full rounded-3xl border shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'}`}>
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center mb-4 shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Test Under Review</h2>
            <p className="text-amber-100 text-sm mt-1">AI is grading & teacher is reviewing</p>
          </div>

          <div className="px-8 py-6 space-y-5">
            <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
              <p className={`text-base leading-relaxed ${currentStyles.mainText}`}>
                ✨ Great job <span className="font-bold text-amber-500">{firstName}</span>! You've submitted your entrance test.
                Our AI is grading it now, and a teacher will review it shortly.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: "✅", label: "Test submitted", done: true },
                { icon: "🤖", label: "AI auto-grading", done: true, active: true },
                { icon: "👨‍🏫", label: "Teacher reviewing", done: false, active: true },
                { icon: "📊", label: "Marks to be released", done: false },
                { icon: "🚀", label: "Full access granted", done: false },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${step.active
                  ? theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
                  : step.done
                    ? theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
                    : theme === 'dark' ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <span className="text-xl">{step.icon}</span>
                  <span className={`text-sm font-medium ${step.active
                    ? theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
                    : step.done
                      ? theme === 'dark' ? 'text-green-300' : 'text-green-700'
                      : currentStyles.subText
                    }`}>{step.label}</span>
                  {step.active && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-medium animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className={`text-center text-xs ${currentStyles.subText}`}>
              ⏱️ Review usually takes <span className="font-semibold">1–2 business days</span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* Awaiting Marks Release */
  if (accountStatus === "awaiting_marks_release") {
    const firstName = pendingUserInfo?.name?.split(" ")[0] || "Student";
    return (
      <main className={`min-h-screen flex items-center justify-center px-4 py-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-green-950' : 'bg-gradient-to-br from-green-50 via-white to-emerald-50'}`}>
        <div className={`max-w-lg w-full rounded-3xl border shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-xl'}`}>
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center mb-4 shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Test Approved!</h2>
            <p className="text-green-100 text-sm mt-1">Waiting for marks release</p>
          </div>

          <div className="px-8 py-6 space-y-5">
            <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-100'}`}>
              <p className={`text-base leading-relaxed ${currentStyles.mainText}`}>
                🎉 Congratulations <span className="font-bold text-green-500">{firstName}</span>! You passed the entrance test!
                Your teacher will release your marks shortly.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: "✅", label: "Test submitted", done: true },
                { icon: "✅", label: "AI graded", done: true },
                { icon: "✅", label: "Teacher approved", done: true },
                { icon: "📊", label: "Awaiting marks release", done: false, active: true },
                { icon: "🚀", label: "Full access granted", done: false },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${step.active
                  ? theme === 'dark' ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
                  : step.done
                    ? theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
                    : theme === 'dark' ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <span className="text-xl">{step.icon}</span>
                  <span className={`text-sm font-medium ${step.active
                    ? theme === 'dark' ? 'text-green-300' : 'text-green-700'
                    : step.done
                      ? theme === 'dark' ? 'text-green-300' : 'text-green-700'
                      : currentStyles.subText
                    }`}>{step.label}</span>
                  {step.active && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500 text-white font-medium animate-pulse">
                      Almost Done
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className={`text-center text-xs ${currentStyles.subText}`}>
              ⏱️ Marks will be released soon by your teacher
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* Test Rejected */
  if (accountStatus === "entrance_test_rejected") {
    return (
      <main className={`min-h-screen ${currentStyles.bg} transition-colors duration-300 flex items-center justify-center px-4 py-6`}>
        <div className={`max-w-md w-full rounded-2xl border border-red-200 dark:border-red-500/30 ${theme === 'light' ? 'bg-red-50' : 'bg-red-500/5'} p-8 shadow-xl backdrop-blur-sm text-center space-y-6`}>
          <div className={`mx-auto w-16 h-16 rounded-full ${theme === 'light' ? 'bg-red-100 border-red-200' : 'bg-red-500/10 border-red-500/20'} border-2 flex items-center justify-center`}>
            <Target className={`w-8 h-8 ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`} />
          </div>
          <div className="space-y-3">
            <h2 className={`text-2xl font-bold ${currentStyles.mainText}`}>
              Entrance Test Not Passed
            </h2>
            <p className={`${currentStyles.subText} leading-relaxed`}>
              Unfortunately, you did not meet the passing criteria for the entrance test.
            </p>
            <p className={`${currentStyles.subText} leading-relaxed`}>
              Please contact your teacher or administrator for guidance on next steps.
            </p>
          </div>
          <div className={`rounded-xl ${currentStyles.statCard} border p-4`}>
            <p className={`text-sm ${currentStyles.subText} mb-2`}>Contact</p>
            <p className={`font-semibold ${currentStyles.mainText}`}>leotuyi10@gmail.com</p>
          </div>
        </div>
      </main>
    );
  }

  /* Error state */
  if (!data) {
    return (
      <main className={`min-h-screen ${currentStyles.bg} transition-colors duration-300 flex items-center justify-center px-4 py-6`}>
        <p className={`${currentStyles.subText} text-sm`}>Could not load dashboard. Try refreshing.</p>
      </main>
    );
  }

  // Handle missing profile data gracefully
  if (!data.profile) {
    return (
      <main className={`min-h-screen ${currentStyles.bg} transition-colors duration-300 px-4 py-6 flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <p className={currentStyles.subText}>Unable to load profile data</p>
          <p className={`text-sm ${currentStyles.subText} opacity-60`}>Please check your connection and try refreshing the page</p>
        </div>
      </main>
    );
  }

  const firstName = data.profile.name?.split(" ")[0] ?? "Student";
  const level = Math.floor(data.profile.xp / 100) + 1;
  const nextPoints = 100 - (data.profile.xp % 100);
  const topEvents = data.upcomingEvents.slice(0, 3);
  const isAdmin = data.profile.role === "admin";

  return (
    <main className={`relative ${currentStyles.bg} min-h-screen transition-colors duration-300`}>
      {/* Simple Clean Background - No complex overlays */}
      <div className="fixed inset-0 -z-10">
        {theme === 'dark' ? (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/30" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30" />
        )}
      </div>

      {/* Theme Toggle Button - Smaller, Bottom Right */}
      <button
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 z-50 p-2 rounded-full ${currentStyles.card} border shadow-lg transition-all ${currentStyles.cardHover}`}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-4 h-4 text-slate-700" />
        ) : (
          <Sun className="w-4 h-4 text-yellow-400" />
        )}
      </button>

      <div className="relative z-10 px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* ── Entrance Test Results Banner (if completed) ──────────────────────── */}
          {data.entranceTestCompleted && (
            <Link
              href="/entrance-test/results"
              className={`block rounded-2xl border overflow-hidden shadow-lg backdrop-blur-sm transition-all hover:shadow-xl ${theme === 'dark'
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                }`}
            >
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
                    }`}>
                    <Trophy className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      }`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'
                      }`}>
                      🎉 Your Entrance Test Results Are Ready!
                    </h3>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'
                      }`}>
                      Click to view your detailed results and download your certificate
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${theme === 'dark'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-600 text-white'
                  }`}>
                  View Results
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          )}

          {/* ── Hero Section with Rotating Images ─────────────────────────────────── */}
          <section className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-center">
            {/* Left: Welcome Content */}
            <div className={`rounded-2xl border ${currentStyles.card} p-8 shadow-lg backdrop-blur-sm space-y-6`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <h1 className={`text-3xl lg:text-4xl font-bold ${currentStyles.mainText}`}>
                    Welcome back,<br />{firstName}!
                  </h1>
                  <p className={`${currentStyles.subText} max-w-xl`}>
                    Your learning journey continues. Track your progress and keep building your skills.
                  </p>
                </div>
              </div>

            </div>

            {/* Right: Rotating Hero Images */}
            <div className="relative h-[420px]">
              {heroImages.map((image, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-700 ${idx === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                >
                  <div className={`relative rounded-2xl overflow-hidden border ${currentStyles.card} shadow-xl h-full backdrop-blur-sm`}>
                    <Image
                      src={image}
                      alt={`Student learning ${idx + 1}`}
                      fill
                      className="object-cover"
                      priority={idx === 0}
                    />
                    <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-t from-slate-900/40 via-transparent to-transparent' : 'bg-gradient-to-t from-slate-950/60 via-transparent to-transparent'}`} />
                  </div>
                </div>
              ))}

              {/* Image indicators */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`h-1.5 rounded-full transition-all ${idx === currentImage
                      ? `${theme === 'light' ? 'bg-blue-600' : 'bg-blue-500'} w-8`
                      : `${theme === 'light' ? 'bg-slate-300' : 'bg-slate-600'} w-1.5 hover:${theme === 'light' ? 'bg-slate-400' : 'bg-slate-500'}`
                      }`}
                    aria-label={`View image ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ── Progress Overview ────────────────────────────────────────────────── */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Left: Last Lesson & Subject Progress */}
            <div className="space-y-6">
              {/* Last Lesson */}
              {data.lastLesson && (
                <div className={`rounded-2xl border ${currentStyles.card} p-6 shadow-lg backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${currentStyles.mainText}`}>Continue Learning</h3>
                    <Clock className={`w-5 h-5 ${currentStyles.iconText}`} />
                  </div>
                  <div className="space-y-3">
                    <div className={`rounded-xl ${currentStyles.statCard} border p-4`}>
                      <p className={`text-sm ${currentStyles.subText} mb-1`}>Last Lesson</p>
                      <p className={`font-semibold ${currentStyles.mainText}`}>{data.lastLesson.title}</p>
                      <p className={`text-xs ${currentStyles.subText} mt-1`}>{data.lastLesson.subject}</p>
                    </div>
                    <Link
                      href={`/lessons/${data.lastLesson.lessonId}`}
                      className={`block w-full rounded-xl ${currentStyles.primary} px-4 py-3 text-center font-semibold transition-all shadow-sm`}
                    >
                      Resume Lesson
                    </Link>
                  </div>
                </div>
              )}

              {/* Subject Progress */}
              {data.subjectSummary && (
                <div className={`rounded-2xl border ${currentStyles.card} p-6 shadow-lg backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${currentStyles.mainText}`}>{data.subjectSummary.subject}</h3>
                    <BarChart3 className={`w-5 h-5 ${currentStyles.iconText}`} />
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`rounded-xl ${currentStyles.statCard} border p-3 text-center`}>
                        <p className={`text-2xl font-bold ${currentStyles.mainText}`}>{data.subjectSummary.total}</p>
                        <p className={`text-xs ${currentStyles.subText} mt-1`}>Total</p>
                      </div>
                      <div className={`rounded-xl ${currentStyles.statCard} border p-3 text-center`}>
                        <p className={`text-2xl font-bold text-emerald-600 dark:text-emerald-400`}>{data.subjectSummary.completed}</p>
                        <p className={`text-xs ${currentStyles.subText} mt-1`}>Completed</p>
                      </div>
                      <div className={`rounded-xl ${currentStyles.statCard} border p-3 text-center`}>
                        <p className={`text-2xl font-bold ${currentStyles.mainText}`}>{data.subjectSummary.remaining}</p>
                        <p className={`text-xs ${currentStyles.subText} mt-1`}>Remaining</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className={currentStyles.subText}>Course Progress</span>
                        <span className={`font-semibold ${currentStyles.mainText}`}>{data.subjectSummary.pct}%</span>
                      </div>
                      <div className={`h-2.5 rounded-full ${currentStyles.progressBar} overflow-hidden`}>
                        <div
                          className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500"
                          style={{ width: `${data.subjectSummary.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Admin Stats (if admin) ────────────────────────────────────────────── */}
          {isAdmin && data.adminStats && (
            <section className={`rounded-2xl border ${theme === 'light' ? 'border-amber-200 bg-amber-50/50' : 'border-amber-500/30 bg-amber-500/5'} p-6 shadow-lg backdrop-blur-sm`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`${theme === 'light' ? 'bg-amber-100 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'} rounded-xl p-3 border`}>
                  <BarChart3 className={`w-6 h-6 ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${currentStyles.mainText}`}>Admin Overview</h2>
                  <p className={`text-sm ${currentStyles.subText}`}>Platform statistics</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className={`rounded-xl ${currentStyles.statCard} border p-4 text-center`}>
                  <p className={`text-xs ${currentStyles.subText} mb-1`}>Total Members</p>
                  <p className={`text-3xl font-bold ${currentStyles.mainText}`}>{data.adminStats.totalMembers}</p>
                </div>
                <div className={`rounded-xl ${currentStyles.statCard} border p-4 text-center`}>
                  <p className={`text-xs ${currentStyles.subText} mb-1`}>Pending Approvals</p>
                  <p className={`text-3xl font-bold ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>{data.adminStats.pendingCount}</p>
                </div>
                <div className={`rounded-xl ${currentStyles.statCard} border p-4 text-center`}>
                  <p className={`text-xs ${currentStyles.subText} mb-1`}>Lessons Completed</p>
                  <p className={`text-3xl font-bold ${currentStyles.mainText}`}>{data.adminStats.lessonsCompleted}</p>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
}
