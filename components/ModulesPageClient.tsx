"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, FileText, GraduationCap, Filter } from "lucide-react";

type CurriculumModule = {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
  category: string;
  pdfPath: string;
  pdfFileName: string;
  fileSize: number | null;
  description?: string | null;
};

type TrainerTrack = {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  tier: string;
  icon: string | null;
  moduleSlug: string | null;
  curriculumUrl: string | null;
  nodes: { id: string }[];
};

type Props = {
  role: "admin" | "trainer" | "student";
  userName: string | null;
  modulesByDept?: Record<string, CurriculumModule[]>;
  trainerTracks?: TrainerTrack[];
  trainerModules?: CurriculumModule[];  // NEW: CurriculumModules assigned to trainer
  groupedModules?: {
    core: CurriculumModule[];
    general: CurriculumModule[];
    ccm: CurriculumModule[];
  };
  userDepartment: string | null;
  userLevel: string | null;
  missingProfile?: boolean;
};

const DEPARTMENT_NAMES: Record<string, string> = {
  "building-construction": "Building Construction",
  "computer-systems-architecture": "Computer Systems Architecture",
  "land-surveying": "Land Surveying",
  "software-development": "Software Development",
};

const LEVEL_NAMES: Record<string, string> = {
  l3: "Level 3",
  l4: "Level 4",
  l5: "Level 5",
};

export default function ModulesPageClient({
  role,
  userName,
  modulesByDept,
  trainerTracks,
  trainerModules,
  groupedModules,
  userDepartment,
  userLevel,
  missingProfile,
}: Props) {
  const router = useRouter();

  // Defensive: Filter out tracks with missing data
  const safeTrainerTracks = (trainerTracks || []).filter(track =>
    track && track.id && track.name && track.tier && Array.isArray(track.nodes)
  );

  // Defensive: Filter out modules with missing data
  const safeTrainerModules = (trainerModules || []).filter(module =>
    module && module.id && module.code && module.name
  );

  const [selectedDept, setSelectedDept] = useState<string>(
    role === "admin" && modulesByDept ? Object.keys(modulesByDept)[0] : ""
  );

  const firstName = userName?.split(" ")[0] || "there";

  // Check if trainer has any content
  const hasSkillTracks = role === "trainer" && safeTrainerTracks.length > 0;
  const hasCurriculumModules = role === "trainer" && safeTrainerModules.length > 0;

  // MISSING PROFILE
  if (missingProfile) {
    return (
      <div className="min-h-screen relative">
        <BackgroundImage />
        <main className="container py-12">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-xl mb-6">
              <span className="text-5xl">🎓</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {!userDepartment ? "Department Not Assigned" : "Level Not Assigned"}
            </h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              {!userDepartment
                ? "Your department hasn't been assigned yet. Please contact your administrator."
                : "Your level hasn't been assigned yet. Please contact your administrator."}
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ADMIN VIEW
  if (role === "admin" && modulesByDept) {
    const departments = Object.keys(modulesByDept);
    const currentModules = selectedDept ? modulesByDept[selectedDept] : [];

    // Group by level and category
    const grouped: Record<string, Record<string, CurriculumModule[]>> = {};
    currentModules.forEach(mod => {
      if (!grouped[mod.level]) grouped[mod.level] = {};
      if (!grouped[mod.level][mod.category]) grouped[mod.level][mod.category] = [];
      grouped[mod.level][mod.category].push(mod);
    });

    return (
      <div className="min-h-screen relative">
        <BackgroundImage />

        {/* Hero Section */}
        <div className="relative border-b border-slate-800/50 bg-gradient-to-b from-slate-900/40 to-transparent backdrop-blur-sm">
          <div className="container py-16">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
                <span className="text-2xl">👑</span>
                <span className="text-sm font-medium text-slate-300">Admin Module Management</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                All <span className="text-slate-300">Curriculum Modules</span>
              </h1>

              <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
                View all curriculum modules across all departments and levels. Filter by department to see specific modules.
              </p>
            </div>
          </div>
        </div>

        {/* Department Filter */}
        <main className="container py-12">
          <div className="mb-8 bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              <Filter className="inline w-4 h-4 mr-2" />
              Filter by Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full md:w-96 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {DEPARTMENT_NAMES[dept] || dept} ({modulesByDept[dept].length} modules)
                </option>
              ))}
            </select>
          </div>

          {/* Modules grouped by level and category */}
          {Object.entries(grouped).map(([level, categories]) => (
            <div key={level} className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">
                {LEVEL_NAMES[level] || level.toUpperCase()}
              </h2>

              {Object.entries(categories).map(([category, modules]) => (
                <ModuleCategory
                  key={category}
                  title={getCategoryTitle(category)}
                  modules={modules}
                  icon={getCategoryIcon(category)}
                  role="admin"
                />
              ))}
            </div>
          ))}

          {currentModules.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              No modules found for this department.
            </div>
          )}
        </main>
      </div>
    );
  }

  // TRAINER VIEW
  if (role === "trainer" && trainerTracks) {
    const hasSkillTracks = trainerTracks.length > 0;
    const hasCurriculumModules = trainerModules && trainerModules.length > 0;

    if (!hasSkillTracks && !hasCurriculumModules) {
      return (
        <div className="min-h-screen relative">
          <BackgroundImage />
          <main className="container py-12">
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-xl mb-6">
                <span className="text-5xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Modules Assigned Yet</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Contact your administrator to get assigned to modules you'll be training.
              </p>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen relative">
        <BackgroundImage />

        {/* Hero Section */}
        <div className="relative border-b border-slate-800/50 bg-gradient-to-b from-slate-900/40 to-transparent backdrop-blur-sm">
          <div className="container py-16">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
                <span className="text-2xl">🎓</span>
                <span className="text-sm font-medium text-slate-300">Trainer Module Management</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Your Assigned <span className="text-slate-300">Modules</span>
              </h1>

              <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
                Prepare content and manage the modules you're training.
              </p>
            </div>
          </div>
        </div>

        <main className="container py-12 space-y-12">
          {/* Curriculum Modules Section */}
          {hasCurriculumModules && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Curriculum Modules</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {safeTrainerModules.map((module) => (
                  <div
                    key={module.id}
                    className="group relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300 
                      bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60 hover:scale-[1.02] hover:shadow-2xl"
                  >
                    <div className="relative p-8 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="text-5xl">📚</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono px-2 py-1 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              {module.code}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-slate-700/40 text-slate-300">
                              {module.level.toUpperCase()}
                            </span>
                          </div>
                          <h2 className="text-2xl font-bold text-white group-hover:text-slate-200 transition-colors">
                            {module.name}
                          </h2>
                          {module.description && (
                            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700/50">
                        <button
                          onClick={() => {
                            console.log('[ModulesPageClient] View Curriculum clicked for:', module.code);
                            // ELECTRON FIX: Use openExternal instead of navigation
                            if (typeof window !== 'undefined' && (window as any).electronAPI?.openExternal) {
                              const fullPath = `/home/leon/Documents/RUNDA TSS Tech Club${module.pdfPath}`;
                              console.log('[ModulesPageClient] Opening PDF externally:', fullPath);
                              (window as any).electronAPI.openExternal(fullPath);
                            } else {
                              // Fallback
                              const downloadUrl = `/api/curriculum/pdf?path=${encodeURIComponent(module.pdfPath)}`;
                              const link = document.createElement('a');
                              link.href = downloadUrl;
                              link.download = module.pdfPath.split('/').pop() || 'curriculum.pdf';
                              link.click();
                            }
                          }}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700 text-sm font-medium text-white hover:bg-slate-900 hover:border-slate-600 transition-all"
                        >
                          <FileText className="inline w-4 h-4 mr-2" />
                          View Curriculum
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/passport/module-track?moduleCode=${module.code}`, {
                                method: 'GET',
                                headers: {
                                  'Accept': 'application/json',
                                },
                              });

                              if (!res.ok) {
                                const errorText = await res.text();
                                alert(`API Error ${res.status}: ${errorText}`);
                                return;
                              }

                              const contentType = res.headers.get('content-type');
                              if (!contentType || !contentType.includes('application/json')) {
                                const text = await res.text();
                                alert(`Expected JSON but got: ${text.substring(0, 200)}`);
                                return;
                              }

                              const data = await res.json();

                              if (!data.trackId) {
                                alert('No trackId in response');
                                return;
                              }

                              // Navigate to the track page
                              window.location.href = `/passport/teach/${data.trackId}`;
                            } catch (error) {
                              alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-sm font-semibold text-violet-300 hover:bg-violet-500/30 transition-all inline-flex items-center"
                        >
                          <BookOpen className="inline w-4 h-4 mr-2" />
                          Prepare Content
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Tracks Section (legacy) */}
          {hasSkillTracks && (
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Skill Tracks</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {safeTrainerTracks.map((track) => (
                  <Link
                    key={track.id}
                    href={`/passport/teach/${track.id}`}
                    className="group relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300 
                      bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60 hover:scale-[1.02] hover:shadow-2xl"
                  >
                    <div className="relative p-8 space-y-4">
                      <div className="flex items-start gap-4">
                        {track.icon && (
                          <div className="text-5xl">{track.icon}</div>
                        )}
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-white group-hover:text-slate-200 transition-colors">
                            {track.name}
                          </h2>
                          {track.description && (
                            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                              {track.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50">
                          <span className="text-lg">📚</span>
                          <span className="text-xs font-medium text-slate-300">{track.nodes?.length || 0} skill nodes</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/40 border border-slate-600/50">
                          <span className="text-lg">🎓</span>
                          <span className="text-xs font-bold text-slate-200">{track.tier?.toUpperCase() || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // STUDENT VIEW - BULLETPROOF FIX FOR SERIALIZATION ERROR
  if (role === "student") {
    // Defensive check: ensure groupedModules exists and has valid array properties
    // This prevents "TypeError: X.filter is not a function" errors
    const safeGroupedModules = {
      core: Array.isArray(groupedModules?.core) ? groupedModules.core : [],
      general: Array.isArray(groupedModules?.general) ? groupedModules.general : [],
      ccm: Array.isArray(groupedModules?.ccm) ? groupedModules.ccm : [],
    };

    return (
      <div className="min-h-screen relative">
        <BackgroundImage />

        {/* Hero Section */}
        <div className="relative border-b border-slate-800/50 bg-gradient-to-b from-slate-900/40 to-transparent backdrop-blur-sm">
          <div className="container py-16">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
                <span className="text-2xl">📚</span>
                <span className="text-sm font-medium text-slate-300">
                  {DEPARTMENT_NAMES[userDepartment!] || userDepartment} · {LEVEL_NAMES[userLevel!] || userLevel}
                </span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                My <span className="text-slate-300">Modules</span>
              </h1>

              <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
                Access your curriculum modules organized by category: Core, General, and CCM.
              </p>
            </div>
          </div>
        </div>

        {/* Modules by Category */}
        <main className="container py-12 space-y-8">
          {safeGroupedModules.core.length > 0 && (
            <ModuleCategory
              title="Core / Specific Modules"
              modules={safeGroupedModules.core}
              icon="🎯"
              role="student"
            />
          )}

          {safeGroupedModules.general.length > 0 && (
            <ModuleCategory
              title="General Modules"
              modules={safeGroupedModules.general}
              icon="📖"
              role="student"
            />
          )}

          {safeGroupedModules.ccm.length > 0 && (
            <ModuleCategory
              title="CCM (Complementary Modules)"
              modules={safeGroupedModules.ccm}
              icon="🌟"
              role="student"
            />
          )}

          {safeGroupedModules.core.length === 0 &&
            safeGroupedModules.general.length === 0 &&
            safeGroupedModules.ccm.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                No modules found for your department and level.
              </div>
            )}
        </main>
      </div>
    );
  }

  return null;
}

// Background Image Component
function BackgroundImage() {
  return (
    <div className="fixed inset-0 -z-10">
      <Image
        src="/images/students-learning.jpg"
        alt="Background"
        fill
        className="object-cover"
        priority
        quality={90}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/95" />
    </div>
  );
}

// Module Category Component
function ModuleCategory({
  title,
  modules,
  icon,
  role,
}: {
  title: string;
  modules: CurriculumModule[];
  icon: string;
  role?: "admin" | "trainer" | "student";
}) {
  const router = useRouter();
  console.log('[ModuleCategory] Component loaded - FIXED VERSION 2024-09-01');
  const openModule = (pdfPath: string) => {
    // ELECTRON FIX: Open PDF directly in system viewer to avoid sandbox crash
    // Navigation to /curriculum/view causes Electron renderer crash
    console.log('[ModuleCategory] Opening PDF in system viewer:', pdfPath);

    if (typeof window !== 'undefined' && (window as any).electronAPI?.openExternal) {
      // Use Electron's shell.openExternal
      const fullPath = `/home/leon/Documents/RUNDA TSS Tech Club${pdfPath}`;
      (window as any).electronAPI.openExternal(fullPath);
    } else {
      // Fallback: try to download the PDF
      const downloadUrl = `/api/curriculum/pdf?path=${encodeURIComponent(pdfPath)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = pdfPath.split('/').pop() || 'curriculum.pdf';
      link.click();
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getModuleLink = (module: CurriculumModule) => {
    // Check if there's a SkillTrack with matching moduleSlug
    const slug = module.code.toLowerCase();
    return `/learn/${slug}`;
  };

  const getButtonText = (role?: string) => {
    if (role === "admin") return "Manage Module";
    if (role === "trainer") return "Prepare Content";
    return "Study Module";
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <span className="ml-auto text-sm text-slate-400">
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {modules.map((module) => (
          <div
            key={module.id}
            className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-600 transition-all group"
          >
            <div className="flex items-start gap-3 mb-3">
              <FileText className="h-5 w-5 text-slate-400 group-hover:text-sky-400 flex-shrink-0 mt-0.5 transition-colors" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-slate-500 mb-1">
                  {module.code}
                </div>
                <div className="font-semibold text-white group-hover:text-sky-300 mb-1 transition-colors">
                  {module.name}
                </div>
                <div className="text-xs text-slate-400">
                  {formatFileSize(module.fileSize)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
              <Link
                href={getModuleLink(module)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition"
              >
                <GraduationCap className="w-4 h-4" />
                {getButtonText(role)}
              </Link>

              <button
                onClick={() => openModule(module.pdfPath)}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
                title="View Curriculum PDF"
              >
                <FileText className="w-4 h-4" />
                Curriculum
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    core: "Core / Specific Modules",
    general: "General Modules",
    ccm: "CCM (Complementary Modules)",
  };
  return titles[category] || category.toUpperCase();
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    core: "🎯",
    general: "📖",
    ccm: "🌟",
  };
  return icons[category] || "📚";
}
