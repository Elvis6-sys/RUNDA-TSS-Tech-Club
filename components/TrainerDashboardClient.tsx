"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  BookOpen, Trophy, Package, Inbox, Folder, ChevronDown, ChevronRight,
  Moon, Sun, Users, Target, BarChart3, FileText, TrendingUp, Calendar,
  Award, CheckCircle2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackNode = {
  id: string;
  title: string;
  description: string | null;
  estimatedMinutes: number;
  xpReward: number;
  order: number;
};

type Track = {
  id: string;
  name: string;
  tier: string;
  icon: string | null;
  curriculumUrl: string | null;
  curriculumType: string | null;
  tableOfContents: unknown[];
  nodes: TrackNode[];
  createdAt: string;
};

type Assignment = {
  assignedAt: string;
  track: Track;
};

type LessonSummary = {
  id: string;
  title: string;
  subject: string;
  tierVisibility: string;
  updatedAt: string;
};

type ResourceSummary = {
  id: string;
  title: string;
  subject: string | null;
  tierVisibility: string;
  createdAt: string;
};

type ChallengeSummary = {
  id: string;
  title: string;
  tier: string;
  status: string;
  dueDate: string;
  _count: { submissions: number };
};

type DashboardData = {
  profile: { name: string | null; role: string };
  assignments: Assignment[];
  lessons: LessonSummary[];
  resources: ResourceSummary[];
  challenges: ChallengeSummary[];
};

// ─── Compact Modules organized by Department & Level ──────────────────────────

function ModulesByDepartmentCompact({
  assignments,
  theme,
  currentStyles
}: {
  assignments: Assignment[];
  theme: 'light' | 'dark';
  currentStyles: any;
}) {
  const grouped = assignments.reduce((acc, assignment) => {
    const tier = assignment.track.tier.toUpperCase();
    const department = extractDepartmentFromName(assignment.track.name);

    if (!acc[department]) {
      acc[department] = {};
    }
    if (!acc[department][tier]) {
      acc[department][tier] = [];
    }
    acc[department][tier].push(assignment);

    return acc;
  }, {} as Record<string, Record<string, Assignment[]>>);

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([department, tiers]) => (
        <DepartmentSectionCompact
          key={department}
          department={department}
          tiers={tiers}
          theme={theme}
          currentStyles={currentStyles}
        />
      ))}
    </div>
  );
}

// Extract department from track name
function extractDepartmentFromName(trackName: string): string {
  if (/software|programming|code|blockchain|web.*dev|app.*dev|mobile.*dev/i.test(trackName)) {
    return "Software Development";
  }
  if (/computer|systems|hardware|electronics/i.test(trackName)) {
    return "Computer Systems";
  }
  if (/data|analytics|science/i.test(trackName)) {
    return "Data Science";
  }
  if (/security|cyber/i.test(trackName)) {
    return "Cybersecurity";
  }
  if (/ai|machine learning|artificial/i.test(trackName)) {
    return "AI & Machine Learning";
  }
  if (/network|infrastructure/i.test(trackName)) {
    return "Networking & Infrastructure";
  }
  if (/design|graphics|multimedia/i.test(trackName)) {
    return "Design & Multimedia";
  }
  return "Software Development";
}

function DepartmentSectionCompact({
  department,
  tiers,
  theme,
  currentStyles
}: {
  department: string;
  tiers: Record<string, Assignment[]>;
  theme: 'light' | 'dark';
  currentStyles: any;
}) {
  const [open, setOpen] = useState(true);
  const totalModules = Object.values(tiers).flat().length;
  const levels = Object.keys(tiers).sort();

  return (
    <div className={`border ${currentStyles.card} rounded-xl overflow-hidden backdrop-blur-sm`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-4 px-5 py-4 transition-all ${currentStyles.cardHover} text-left`}
      >
        <div className="flex items-center gap-3">
          <div className={`${currentStyles.iconBg} rounded-lg p-2 border`}>
            <Folder className={`w-5 h-5 ${currentStyles.iconText}`} />
          </div>
          <div>
            <span className={`font-semibold ${currentStyles.mainText} text-sm`}>{department}</span>
            <div className="flex items-center gap-2 mt-1">
              {levels.map((level) => (
                <span
                  key={level}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${currentStyles.badge}`}
                >
                  {level}
                </span>
              ))}
              <span className={`text-xs ${currentStyles.subText}`}>
                • {totalModules} module{totalModules !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 ${currentStyles.subText} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-700'}`}>
          {Object.entries(tiers)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([tier, modules]) => (
              <LevelSectionCompact
                key={tier}
                tier={tier}
                modules={modules}
                theme={theme}
                currentStyles={currentStyles}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function LevelSectionCompact({
  tier,
  modules,
  theme,
  currentStyles
}: {
  tier: string;
  modules: Assignment[];
  theme: 'light' | 'dark';
  currentStyles: any;
}) {
  const [open, setOpen] = useState(true);

  const tierColors = {
    light: {
      L3: 'bg-blue-50 text-blue-700 border-blue-200',
      L4: 'bg-purple-50 text-purple-700 border-purple-200',
      L5: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      L6: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    dark: {
      L3: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      L4: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      L5: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      L6: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    }
  };

  const colorClass = tierColors[theme][tier as keyof typeof tierColors.light] || currentStyles.badge;

  return (
    <div className={`border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-700'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-4 px-5 py-3 transition-all ${currentStyles.cardHover} text-left`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${colorClass}`}>
            {tier}
          </span>
          <span className={`text-sm ${currentStyles.mainText}`}>
            {modules.length} module{modules.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 ${currentStyles.subText} transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div>
          {modules.map((assignment) => (
            <ModuleRowCompact
              key={assignment.track.id}
              assignment={assignment}
              currentStyles={currentStyles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleRowCompact({
  assignment,
  currentStyles
}: {
  assignment: Assignment;
  currentStyles: any;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 px-5 py-3 border-t ${currentStyles.card.includes('slate-200') ? 'border-slate-100' : 'border-slate-800'} transition-all ${currentStyles.cardHover}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {assignment.track.icon && (
          <span className="text-lg shrink-0">{assignment.track.icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${currentStyles.mainText} truncate font-medium`}>
            {assignment.track.name}
          </p>
          <p className={`text-xs ${currentStyles.subText}`}>
            {assignment.track.nodes.length} node{assignment.track.nodes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <Link
        href={`/passport/teach/${assignment.track.id}`}
        className={`shrink-0 px-4 py-2 text-xs font-medium rounded-lg border transition-all ${currentStyles.card.includes('white')
          ? 'text-purple-600 hover:text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100'
          : 'text-purple-400 hover:text-purple-300 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20'
          }`}
      >
        Manage
      </Link>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrainerDashboardClient() {
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

  // Teacher hero images - NEW REAL PHOTOS
  const heroImages = [
    "/images/teacher-instruction.jpg",
    "/images/teacher-demo.jpg",
    "/images/teacher-workstation.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    fetch("/api/trainer/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Theme-based styles matching landing page - PURPLE THEME FOR TEACHERS
  const styles = {
    light: {
      bg: "bg-slate-50",
      mainText: "text-slate-900",
      subText: "text-slate-600",
      card: "bg-white border-slate-200",
      cardHover: "hover:shadow-md hover:border-purple-200",
      primary: "bg-purple-600 hover:bg-purple-700 text-white",
      secondary: "bg-white border-slate-300 text-slate-700 hover:border-purple-300 hover:bg-slate-50",
      badge: "bg-purple-50 border-purple-200 text-purple-700",
      statCard: "bg-white border-slate-200 shadow-sm",
      iconBg: "bg-purple-50 border-purple-100",
      iconText: "text-purple-600",
    },
    dark: {
      bg: "bg-slate-900",
      mainText: "text-white",
      subText: "text-slate-300",
      card: "bg-slate-800/50 border-slate-700",
      cardHover: "hover:shadow-xl hover:shadow-purple-500/10 hover:border-slate-600",
      primary: "bg-purple-500 hover:bg-purple-600 text-white",
      secondary: "bg-slate-800 border-slate-600 text-slate-100 hover:border-purple-500 hover:bg-slate-700",
      badge: "bg-purple-500/10 border-purple-500/30 text-purple-300",
      statCard: "bg-slate-800/50 border-slate-700 shadow-sm",
      iconBg: "bg-purple-500/10 border-purple-500/20",
      iconText: "text-purple-400",
    }
  };

  const currentStyles = styles[theme];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className={`h-32 rounded-2xl ${currentStyles.card} border backdrop-blur-sm`} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={`h-64 rounded-2xl ${currentStyles.card} border backdrop-blur-sm`} />
          <div className={`h-64 rounded-2xl ${currentStyles.card} border backdrop-blur-sm`} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <p className={`${currentStyles.subText} text-sm text-center py-12`}>
        Could not load your dashboard. Try refreshing.
      </p>
    );
  }

  const firstName = data.profile.name?.split(" ")[0] ?? "Trainer";

  return (
    <div className="space-y-8">

      {/* ── Hero Section with Stats & Image ───────────────────────────────────── */}
      <section className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-center">
        {/* Left: Welcome & Stats */}
        <div className={`rounded-2xl border ${currentStyles.card} p-8 shadow-lg backdrop-blur-sm space-y-6`}>
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border ${currentStyles.badge} px-4 py-1.5 text-xs font-medium backdrop-blur-sm mb-3`}>
              <Target className="w-3.5 h-3.5" />
              <span>Trainer Portal</span>
            </div>
            <h1 className={`text-3xl lg:text-4xl font-bold ${currentStyles.mainText}`}>
              Welcome back,<br />{firstName}!
            </h1>
            <p className={`${currentStyles.subText} mt-3 max-w-xl`}>
              Manage your modules, track student progress, and deliver exceptional learning experiences.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`rounded-xl border ${currentStyles.statCard} p-4 backdrop-blur-sm`}>
              <div className={`${currentStyles.iconBg} rounded-lg p-2 w-fit border mb-2`}>
                <Package className={`w-5 h-5 ${currentStyles.iconText}`} />
              </div>
              <p className={`text-2xl font-bold ${currentStyles.mainText}`}>{data.assignments.length}</p>
              <p className={`text-xs ${currentStyles.subText} mt-1`}>Modules</p>
            </div>
            <div className={`rounded-xl border ${currentStyles.statCard} p-4 backdrop-blur-sm`}>
              <div className={`${currentStyles.iconBg} rounded-lg p-2 w-fit border mb-2`}>
                <BookOpen className={`w-5 h-5 ${currentStyles.iconText}`} />
              </div>
              <p className={`text-2xl font-bold ${currentStyles.mainText}`}>{data.resources.length}</p>
              <p className={`text-xs ${currentStyles.subText} mt-1`}>Resources</p>
            </div>
            <div className={`rounded-xl border ${currentStyles.statCard} p-4 backdrop-blur-sm`}>
              <div className={`${currentStyles.iconBg} rounded-lg p-2 w-fit border mb-2`}>
                <Trophy className={`w-5 h-5 ${currentStyles.iconText}`} />
              </div>
              <p className={`text-2xl font-bold ${currentStyles.mainText}`}>{data.challenges.length}</p>
              <p className={`text-xs ${currentStyles.subText} mt-1`}>Challenges</p>
            </div>
          </div>
        </div>

        {/* Right: Rotating Hero Images */}
        <div className="relative h-[380px]">
          {heroImages.map((image, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-700 ${idx === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
            >
              <div className={`relative rounded-2xl overflow-hidden border ${currentStyles.card} shadow-xl h-full backdrop-blur-sm`}>
                <Image
                  src={image}
                  alt={`Teacher workspace ${idx + 1}`}
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
                  ? `${theme === 'light' ? 'bg-purple-600' : 'bg-purple-500'} w-8`
                  : `${theme === 'light' ? 'bg-slate-300' : 'bg-slate-600'} w-1.5 hover:${theme === 'light' ? 'bg-slate-400' : 'bg-slate-500'}`
                  }`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Assigned Modules ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${currentStyles.mainText} flex items-center gap-3`}>
              <div className={`${currentStyles.iconBg} rounded-xl p-2.5 border`}>
                <Package className={`w-6 h-6 ${currentStyles.iconText}`} />
              </div>
              Your Assigned Modules
            </h2>
            <p className={`${currentStyles.subText} text-sm mt-2`}>
              Organized by department and level
            </p>
          </div>
        </div>

        {data.assignments.length === 0 ? (
          <div className={`border-2 border-dashed ${currentStyles.card} rounded-2xl px-6 py-16 text-center backdrop-blur-sm`}>
            <div className={`${currentStyles.iconBg} rounded-2xl p-6 w-fit mx-auto border mb-4`}>
              <Inbox className={`w-12 h-12 ${currentStyles.iconText}`} />
            </div>
            <p className={`${currentStyles.mainText} font-semibold text-lg mb-2`}>No modules assigned yet</p>
            <p className={`${currentStyles.subText} text-sm`}>Contact your administrator to get started</p>
          </div>
        ) : (
          <ModulesByDepartmentCompact
            assignments={data.assignments}
            theme={theme}
            currentStyles={currentStyles}
          />
        )}
      </section>

      {/* ── Resources & Challenges Grid ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Resources */}
        <section className={`rounded-2xl border ${currentStyles.card} p-6 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-xl font-bold ${currentStyles.mainText} flex items-center gap-2`}>
                <BookOpen className={`w-5 h-5 ${currentStyles.iconText}`} />
                Resources
              </h3>
              <p className={`${currentStyles.subText} text-xs mt-1`}>Learning materials</p>
            </div>
            <Link
              href="/resources"
              className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all ${theme === 'light'
                ? 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100'
                : 'text-purple-400 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20'
                }`}
            >
              View all →
            </Link>
          </div>

          {data.resources.length === 0 ? (
            <p className={`text-sm ${currentStyles.subText} italic py-8 text-center`}>No resources yet</p>
          ) : (
            <div className="space-y-2">
              {data.resources.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${currentStyles.card} transition-all ${currentStyles.cardHover} backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`${currentStyles.iconBg} rounded-lg p-2 border shrink-0`}>
                      <FileText className={`w-4 h-4 ${currentStyles.iconText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${currentStyles.mainText} truncate font-medium`}>{r.title}</p>
                      <p className={`text-xs ${currentStyles.subText}`}>{format(new Date(r.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${currentStyles.badge} border shrink-0`}>
                    {r.tierVisibility.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Challenges */}
        <section className={`rounded-2xl border ${currentStyles.card} p-6 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-xl font-bold ${currentStyles.mainText} flex items-center gap-2`}>
                <Trophy className={`w-5 h-5 ${currentStyles.iconText}`} />
                Challenges
              </h3>
              <p className={`${currentStyles.subText} text-xs mt-1`}>Student assessments</p>
            </div>
            <Link
              href="/challenges"
              className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all ${theme === 'light'
                ? 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100'
                : 'text-purple-400 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20'
                }`}
            >
              View all →
            </Link>
          </div>

          {data.challenges.length === 0 ? (
            <p className={`text-sm ${currentStyles.subText} italic py-8 text-center`}>No challenges yet</p>
          ) : (
            <div className="space-y-2">
              {data.challenges.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${currentStyles.card} transition-all ${currentStyles.cardHover} backdrop-blur-sm`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`${currentStyles.iconBg} rounded-lg p-2 border shrink-0`}>
                      <Award className={`w-4 h-4 ${currentStyles.iconText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${currentStyles.mainText} truncate font-medium`}>{c.title}</p>
                      <p className={`text-xs ${currentStyles.subText}`}>{c._count.submissions} submission{c._count.submissions !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${c.status === "open"
                    ? theme === 'light'
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : currentStyles.badge
                    }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
