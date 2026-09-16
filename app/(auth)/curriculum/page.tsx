"use client";

import { useEffect, useState } from "react";
import { FileText, BookOpen, GraduationCap, Loader2 } from "lucide-react";

interface Module {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
  category: string;
  pdfPath: string;
  pdfFileName: string;
  fileSize: number | null;
}

interface GroupedModules {
  general: Module[];
  core: Module[];
  ccm: Module[];
}

const DEPARTMENT_NAMES: Record<string, string> = {
  "software-development": "Software Development",
  "computer-systems-architecture": "Computer Systems and Architecture",
  "building-construction": "Building and Construction",
  "land-surveying": "Land Surveying",
};

const LEVEL_NAMES: Record<string, string> = {
  l3: "Level 3",
  l4: "Level 4",
  l5: "Level 5",
};

export default function CurriculumPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [modules, setModules] = useState<GroupedModules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data.profile);
          setSelectedLevel(data.profile.level || "");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    }
    fetchProfile();
  }, []);

  // Fetch modules when level is selected
  useEffect(() => {
    if (!selectedLevel || !userProfile?.department) return;

    async function fetchModules() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/curriculum/modules?department=${userProfile.department}&level=${selectedLevel}`
        );

        if (!res.ok) throw new Error("Failed to fetch modules");

        const data = await res.json();
        setModules(data.modules);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchModules();
  }, [selectedLevel, userProfile?.department]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const openModule = (pdfPath: string) => {
    // In offline mode, serve PDFs through API route
    const apiUrl = `/api/curriculum/pdf?path=${encodeURIComponent(pdfPath)}`;
    window.open(apiUrl, "_blank");
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!userProfile.department || !userProfile.level) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Profile Incomplete
          </h2>
          <p className="text-yellow-700">
            Please update your profile with your department and level to access curriculum modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Curriculum</h1>
        <p className="text-gray-600">
          {DEPARTMENT_NAMES[userProfile.department] || userProfile.department}
        </p>
      </div>

      {/* Level Selector */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium mb-2">Select Level</label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose your level...</option>
          <option value={userProfile.level}>
            {LEVEL_NAMES[userProfile.level] || userProfile.level}
          </option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Modules Display */}
      {!loading && modules && (
        <div className="space-y-8">
          {/* General Modules */}
          {modules.general.length > 0 && (
            <ModuleCategory
              title="General Modules"
              icon={BookOpen}
              modules={modules.general}
              onOpenModule={openModule}
              formatFileSize={formatFileSize}
            />
          )}

          {/* Core/Specific Modules */}
          {modules.core.length > 0 && (
            <ModuleCategory
              title="Core Modules"
              icon={GraduationCap}
              modules={modules.core}
              onOpenModule={openModule}
              formatFileSize={formatFileSize}
            />
          )}

          {/* CCM Modules */}
          {modules.ccm.length > 0 && (
            <ModuleCategory
              title="CCM (Complementary Modules)"
              icon={FileText}
              modules={modules.ccm}
              onOpenModule={openModule}
              formatFileSize={formatFileSize}
            />
          )}

          {/* No Modules */}
          {modules.general.length === 0 &&
            modules.core.length === 0 &&
            modules.ccm.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No modules found for this level.</p>
              </div>
            )}
        </div>
      )}

      {/* Offline Notice */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700">
          ✅ <strong>Offline Access:</strong> All curriculum modules are stored locally.
          You can access them anytime without internet connection.
        </p>
      </div>
    </div>
  );
}

// Module Category Component
function ModuleCategory({
  title,
  icon: Icon,
  modules,
  onOpenModule,
  formatFileSize,
}: {
  title: string;
  icon: any;
  modules: Module[];
  onOpenModule: (path: string) => void;
  formatFileSize: (size: number | null) => string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="ml-auto text-sm text-gray-500">
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onOpenModule(module.pdfPath)}
            className="text-left p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-gray-500 mb-1">
                  {module.code}
                </div>
                <div className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                  {module.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(module.fileSize)}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
