"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Moon, Sun, Briefcase, Plus, UserPlus, CheckCircle,
  Clock, Archive, FileText, Send, AlertCircle, XCircle, Upload, Paperclip
} from "lucide-react";

type ProjectMember = {
  userId: string;
  roleInProject: string;
  status: string;
  requestedAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
  user: {
    name: string | null;
    role: string;
  };
};

type ProjectSubmission = {
  id: string;
  projectId: string;
  userId: string;
  submissionUrl: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  note: string | null;
  submittedAt: Date;
  updatedAt: Date;
  grade: number | null;
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: Date | null;
  status: string;
  user: {
    name: string | null;
    role: string;
  };
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  tierVisibility: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  members: ProjectMember[];
  submissions?: ProjectSubmission[];
};

/* ── Hero images ────────────────────────────────────────────── */
const HERO_IMAGES = [
  "/images/student-focused.jpg",
  "/images/students-group.jpg",
  "/images/students-learning.jpg",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  draft: {
    label: "Draft",
    color: "text-slate-400 bg-slate-500/10 border-slate-500/30 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/30",
    icon: <FileText className="w-4 h-4" />,
  },
  active: {
    label: "Active",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30",
    icon: <Clock className="w-4 h-4" />,
  },
  completed: {
    label: "Completed",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/30",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  archived: {
    label: "Archived",
    color: "text-slate-500 bg-slate-500/10 border-slate-500/30 dark:text-slate-500 dark:bg-slate-500/10 dark:border-slate-500/30",
    icon: <Archive className="w-4 h-4" />,
  },
};

export default function ProjectsClient({
  projects: initialProjects,
  canCreate,
  userId,
  role,
}: {
  projects: Project[];
  canCreate: boolean;
  userId: string;
  role: string;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tierVisibility, setTierVisibility] = useState("all");
  const [loading, setLoading] = useState(false);

  // Join/Submit/Approve states
  const [joiningProject, setJoiningProject] = useState<string | null>(null);
  const [approvingMember, setApprovingMember] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState<Record<string, string>>({});
  const [submissionNote, setSubmissionNote] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  const isTeacher = ["admin", "trainer"].includes(role);;

  // Load theme
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    if (stored) setTheme(stored);
  }, []);

  // Rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, tierVisibility }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      showToast(body?.error || "Failed to create project.");
      return;
    }

    const newProject = await res.json();
    setProjects((prev) => [newProject, ...prev]);
    setTitle("");
    setDescription("");
    setTierVisibility("all");
    setShowForm(false);
    showToast("Project created successfully!");
    router.refresh();
  }

  async function handleJoinProject(projectId: string) {
    setJoiningProject(projectId);

    try {
      const res = await fetch(`/api/projects/${projectId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data?.error || "Failed to join project.");
        setJoiningProject(null);
        return;
      }

      showToast(data.message || "Join request sent! Waiting for teacher approval.");

      // Update local state to reflect pending membership
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
              ...p,
              members: [
                ...p.members,
                {
                  userId,
                  roleInProject: "member",
                  status: "pending",
                  requestedAt: new Date(),
                  approvedAt: null,
                  approvedBy: null,
                  user: { name: "You", role },
                },
              ],
            }
            : p
        )
      );

      router.refresh();
    } catch (error) {
      showToast("An error occurred. Please try again.");
    } finally {
      setJoiningProject(null);
    }
  }

  async function handleSubmitWork(projectId: string) {
    const url = submissionUrl[projectId]?.trim();
    if (!url) {
      showToast("Please provide a submission URL");
      return;
    }

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Upload file if one is selected
      const file = uploadedFiles[projectId];
      if (file) {
        setUploadingFile(projectId);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("uploadType", "project");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          showToast("Failed to upload file");
          setUploadingFile(null);
          return;
        }

        const uploadData = await uploadRes.json();
        fileUrl = uploadData.url;
        fileName = file.name;
        fileType = file.type;
        setUploadingFile(null);
      }

      // Submit work with file info
      const res = await fetch(`/api/projects/${projectId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionUrl: url,
          note: submissionNote[projectId] || null,
          fileUrl,
          fileName,
          fileType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data?.error || "Failed to submit work.");
        return;
      }

      showToast(data.message || "Work submitted successfully!");
      setSubmissionUrl((prev) => ({ ...prev, [projectId]: "" }));
      setSubmissionNote((prev) => ({ ...prev, [projectId]: "" }));
      setUploadedFiles((prev) => ({ ...prev, [projectId]: null }));
      router.refresh();
    } catch (error) {
      showToast("An error occurred. Please try again.");
      setUploadingFile(null);
    }
  }

  async function handleApproveMember(projectId: string, memberId: string, action: "approve" | "reject") {
    setApprovingMember(memberId);

    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data?.error || "Failed to process request.");
        setApprovingMember(null);
        return;
      }

      showToast(data.message);

      // Update local state
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
              ...p,
              members: p.members.map((m) =>
                m.userId === memberId
                  ? { ...m, status: action === "approve" ? "approved" : "rejected" }
                  : m
              ),
            }
            : p
        )
      );

      router.refresh();
    } catch (error) {
      showToast("An error occurred. Please try again.");
    } finally {
      setApprovingMember(null);
    }
  }

  const isDark = theme === "dark";
  const currentStyles = isDark
    ? {
      bg: "bg-slate-950",
      mainText: "text-white",
      subText: "text-slate-400",
      card: "bg-slate-900/50 border-slate-800/50",
      cardHover: "hover:bg-slate-900/70 hover:border-slate-700",
      input: "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500",
      button: "border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
      createButton: "border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20",
      gradient: "from-slate-950/95 via-slate-950/90 to-slate-950/80",
    }
    : {
      bg: "bg-white",
      mainText: "text-slate-900",
      subText: "text-slate-600",
      card: "bg-white/60 border-slate-200",
      cardHover: "hover:bg-white/80 hover:border-slate-300",
      input: "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500",
      button: "border-blue-500/40 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      createButton: "border-sky-500/40 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20",
      gradient: "from-white/95 via-white/90 to-white/80",
    };

  const activeProjects = projects.filter((p) => p.status === "active" || p.status === "in_progress");
  const otherProjects = projects.filter((p) => p.status !== "active" && p.status !== "in_progress");

  return (
    <div className={`min-h-screen ${currentStyles.bg} transition-colors duration-300`}>
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        {HERO_IMAGES.map((img, idx) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        <div className={`absolute inset-0 bg-gradient-to-b ${currentStyles.gradient}`} />

        {/* Header Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                    <Briefcase className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className={`text-xs uppercase tracking-[0.3em] ${currentStyles.subText}`}>
                    Collaborative
                  </p>
                </div>
                <h1 className={`text-4xl font-bold ${currentStyles.mainText} mb-2`}>Projects</h1>
                <p className={`text-sm ${currentStyles.subText}`}>
                  Join projects, collaborate with peers, and submit your work.
                </p>
              </div>
              {canCreate && (
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition backdrop-blur-sm ${currentStyles.createButton}`}
                >
                  {showForm ? "Cancel" : "+ New Project"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-5 py-3 text-sm shadow-xl backdrop-blur-sm ${isDark
              ? "border-slate-700 bg-slate-800/90 text-white"
              : "border-slate-300 bg-white/90 text-slate-900"
              }`}
          >
            {toast}
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`fixed bottom-6 right-6 z-50 p-2 rounded-xl border transition backdrop-blur-sm ${isDark
            ? "bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700"
            : "bg-white/90 border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className={`rounded-2xl border p-6 space-y-4 backdrop-blur-sm ${currentStyles.card}`}
          >
            <h2 className={`font-semibold ${currentStyles.mainText}`}>New Project</h2>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition ${currentStyles.input}`}
            />
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description (optional)"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none resize-none transition ${currentStyles.input}`}
            />
            <select
              value={tierVisibility}
              onChange={(e) => setTierVisibility(e.target.value)}
              className={`rounded-xl border px-3 py-2 text-sm focus:outline-none transition ${currentStyles.input}`}
            >
              <option value="all">Visible to: Everyone</option>
              <option value="l5">Visible to: L5 and above</option>
              <option value="alumni">Visible to: Alumni and above</option>
              <option value="admin">Visible to: Admins only</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2 text-sm font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50 ${isDark ? "text-emerald-300" : "text-emerald-600"
                }`}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </form>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div
            className={`rounded-2xl border p-12 text-center backdrop-blur-sm ${currentStyles.card}`}
          >
            <Briefcase className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className={`text-lg font-semibold ${currentStyles.mainText} mb-2`}>
              No Projects Yet
            </h3>
            <p className={currentStyles.subText}>
              {canCreate
                ? "Create your first project to get started."
                : "No projects available at the moment. Check back later!"}
            </p>
          </div>
        )}

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <div className="space-y-4">
            <h2 className={`text-sm uppercase tracking-widest ${currentStyles.subText}`}>
              Active Projects
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  userId={userId}
                  role={role}
                  isTeacher={isTeacher}
                  isDark={isDark}
                  currentStyles={currentStyles}
                  isExpanded={expandedProject === project.id}
                  onToggleExpand={() =>
                    setExpandedProject(expandedProject === project.id ? null : project.id)
                  }
                  onJoin={() => handleJoinProject(project.id)}
                  onSubmit={() => handleSubmitWork(project.id)}
                  onApproveMember={(memberId, action) => handleApproveMember(project.id, memberId, action)}
                  submissionUrl={submissionUrl[project.id] || ""}
                  setSubmissionUrl={(url) =>
                    setSubmissionUrl((prev) => ({ ...prev, [project.id]: url }))
                  }
                  submissionNote={submissionNote[project.id] || ""}
                  setSubmissionNote={(note) =>
                    setSubmissionNote((prev) => ({ ...prev, [project.id]: note }))
                  }
                  uploadedFile={uploadedFiles[project.id] || null}
                  setUploadedFile={(file) =>
                    setUploadedFiles((prev) => ({ ...prev, [project.id]: file }))
                  }
                  isJoining={joiningProject === project.id}
                  approvingMember={approvingMember}
                  isUploading={uploadingFile === project.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <div className="space-y-4">
            <h2 className={`text-sm uppercase tracking-widest ${currentStyles.subText}`}>
              {activeProjects.length > 0 ? "Other Projects" : "All Projects"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  userId={userId}
                  role={role}
                  isTeacher={isTeacher}
                  isDark={isDark}
                  currentStyles={currentStyles}
                  isExpanded={expandedProject === project.id}
                  onToggleExpand={() =>
                    setExpandedProject(expandedProject === project.id ? null : project.id)
                  }
                  onJoin={() => handleJoinProject(project.id)}
                  onSubmit={() => handleSubmitWork(project.id)}
                  onApproveMember={(memberId, action) => handleApproveMember(project.id, memberId, action)}
                  submissionUrl={submissionUrl[project.id] || ""}
                  setSubmissionUrl={(url) =>
                    setSubmissionUrl((prev) => ({ ...prev, [project.id]: url }))
                  }
                  submissionNote={submissionNote[project.id] || ""}
                  setSubmissionNote={(note) =>
                    setSubmissionNote((prev) => ({ ...prev, [project.id]: note }))
                  }
                  uploadedFile={uploadedFiles[project.id] || null}
                  setUploadedFile={(file) =>
                    setUploadedFiles((prev) => ({ ...prev, [project.id]: file }))
                  }
                  isJoining={joiningProject === project.id}
                  approvingMember={approvingMember}
                  isUploading={uploadingFile === project.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  userId,
  role,
  isTeacher,
  isDark,
  currentStyles,
  isExpanded,
  onToggleExpand,
  onJoin,
  onSubmit,
  onApproveMember,
  submissionUrl,
  setSubmissionUrl,
  submissionNote,
  setSubmissionNote,
  uploadedFile,
  setUploadedFile,
  isJoining,
  approvingMember,
  isUploading,
}: {
  project: Project;
  userId: string;
  role: string;
  isTeacher: boolean;
  isDark: boolean;
  currentStyles: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onJoin: () => void;
  onSubmit: () => void;
  onApproveMember: (memberId: string, action: "approve" | "reject") => void;
  submissionUrl: string;
  setSubmissionUrl: (url: string) => void;
  submissionNote: string;
  setSubmissionNote: (note: string) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  isJoining: boolean;
  approvingMember: string | null;
  isUploading: boolean;
}) {
  const myMembership = project.members?.find((m) => m.userId === userId);
  const isMember = myMembership?.status === "approved";
  const isPending = myMembership?.status === "pending";
  const isRejected = myMembership?.status === "rejected";
  const isProjectCreator = project.createdBy === userId;

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
  const memberCount = project.members?.filter((m) => m.status === "approved").length || 0;
  const pendingCount = project.members?.filter((m) => m.status === "pending").length || 0;

  return (
    <div
      className={`rounded-2xl border p-5 backdrop-blur-sm transition ${currentStyles.card} ${currentStyles.cardHover}`}
    >
      {/* Card Header */}
      <button className="w-full text-left" onClick={onToggleExpand}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className={`text-lg font-semibold ${currentStyles.mainText} flex-1`}>
            {project.title}
          </h3>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 ${statusConfig.color}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>

        {project.description && (
          <p className={`text-sm ${currentStyles.subText} mb-3 line-clamp-2`}>
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className={currentStyles.subText}>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>
            {pendingCount > 0 && (isProjectCreator || role === "admin") && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-amber-500/20 border-amber-500/40 text-amber-600"
                }`}>
                {pendingCount} pending
              </span>
            )}
            {(isProjectCreator || role === "admin") && (project.submissions?.length || 0) > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-emerald-500/20 border-emerald-500/40 text-emerald-600"
                }`}>
                {project.submissions?.length} {project.submissions?.length === 1 ? "submission" : "submissions"}
              </span>
            )}
          </div>
          <span className={currentStyles.subText}>
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4" style={{ borderColor: isDark ? "rgba(51, 65, 85, 0.5)" : "rgba(226, 232, 240, 0.8)" }}>
          {/* Members List & Pending Requests - Visible to all */}
          {project.members && project.members.length > 0 && (
            <div className="space-y-4">
              {/* Approved Members */}
              {project.members.filter((m) => m.status === "approved").length > 0 && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${currentStyles.subText} mb-2`}>
                    Team Members
                  </p>
                  <div className="space-y-2">
                    {project.members.filter((m) => m.status === "approved").map((member) => (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"
                          }`}
                      >
                        <span className={currentStyles.mainText}>
                          {member.user.name || "Unknown User"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${member.roleInProject === "lead"
                          ? isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-500/20 text-purple-600"
                          : isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-500/20 text-emerald-600"
                          }`}>
                          {member.roleInProject}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Requests - Only visible to project creator or admin */}
              {(isProjectCreator || role === "admin") && project.members.filter((m) => m.status === "pending").length > 0 && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${currentStyles.subText} mb-2`}>
                    Pending Join Requests
                  </p>
                  <div className="space-y-2">
                    {project.members.filter((m) => m.status === "pending").map((member) => (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg border ${isDark
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-amber-500/20 border-amber-500/40"
                          }`}
                      >
                        <div>
                          <span className={`font-medium ${currentStyles.mainText}`}>
                            {member.user.name || "Unknown User"}
                          </span>
                          <p className={`text-xs ${currentStyles.subText} mt-0.5`}>
                            Requested {new Date(member.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onApproveMember(member.userId, "approve")}
                            disabled={approvingMember === member.userId}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${isDark
                              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                              : "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border border-emerald-500/40"
                              }`}
                          >
                            {approvingMember === member.userId ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => onApproveMember(member.userId, "reject")}
                            disabled={approvingMember === member.userId}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${isDark
                              ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                              : "bg-rose-500/20 text-rose-600 hover:bg-rose-500/30 border border-rose-500/40"
                              }`}
                          >
                            {approvingMember === member.userId ? "..." : "Reject"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Submissions Button - Visible to project creator and admin */}
          {(isProjectCreator || role === "admin") && (
            <button
              onClick={() => window.location.href = `/projects/${project.id}/submissions`}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${isDark
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                }`}
            >
              <FileText className="w-4 h-4" />
              View All Submissions
              {project.submissions && project.submissions.length > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${isDark
                  ? "bg-emerald-500/20"
                  : "bg-emerald-500/30"
                  }`}>
                  {project.submissions.length}
                </span>
              )}
            </button>
          )}

          {/* Submissions List - Visible to project creator and admin */}
          {(isProjectCreator || role === "admin") && project.submissions && project.submissions.length > 0 && (
            <div className={`space-y-3 p-4 rounded-xl border ${isDark
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <p className={`text-sm font-semibold ${currentStyles.mainText}`}>
                    Submitted Work ({project.submissions.length})
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = `/projects/${project.id}/submissions`}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${isDark
                    ? "text-blue-400 hover:bg-blue-500/10"
                    : "text-blue-600 hover:bg-blue-500/10"
                    }`}
                >
                  View All →
                </button>
              </div>
              <div className="space-y-2">
                {project.submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className={`rounded-lg border px-3 py-3 text-sm ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`font-semibold ${currentStyles.mainText}`}>
                          {submission.user.name || "Unknown User"}
                        </span>
                        <p className={`text-xs ${currentStyles.subText} mt-0.5`}>
                          Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                          {submission.updatedAt > submission.submittedAt &&
                            ` • Updated ${new Date(submission.updatedAt).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                    <a
                      href={submission.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs break-all hover:underline flex items-center gap-1 ${isDark ? "text-blue-400" : "text-blue-600"
                        }`}
                    >
                      <FileText className="w-3 h-3 flex-shrink-0" />
                      {submission.submissionUrl}
                    </a>
                    {submission.note && (
                      <p className={`text-xs mt-2 italic ${currentStyles.subText}`}>
                        Note: {submission.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Join/Request Button - Only for students who haven't requested */}
          {!isTeacher && !isProjectCreator && !isMember && !isPending && !isRejected && project.status === "active" && (
            <button
              onClick={onJoin}
              disabled={isJoining}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${isDark
                ? "border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                : "border-purple-500/40 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                }`}
            >
              <UserPlus className="w-4 h-4" />
              {isJoining ? "Sending..." : "Request to Join"}
            </button>
          )}

          {/* Pending Status */}
          {isPending && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${isDark
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-amber-500/20 border-amber-500/40 text-amber-600"
              }`}>
              <Clock className="w-4 h-4" />
              Join request pending approval
            </div>
          )}

          {/* Rejected Status */}
          {isRejected && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${isDark
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-rose-500/20 border-rose-500/40 text-rose-600"
              }`}>
              <XCircle className="w-4 h-4" />
              Join request was rejected
            </div>
          )}

          {/* Submit Work Form - Only for Approved Members */}
          {isMember && (
            <div className={`space-y-4 rounded-xl border p-5 ${isDark
              ? "bg-blue-500/5 border-blue-500/20"
              : "bg-blue-50 border-blue-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-blue-400" />
                <p className={`text-sm font-semibold ${currentStyles.mainText}`}>
                  Submit Your Work
                </p>
              </div>

              {/* Submission URL */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${currentStyles.subText}`}>
                  Submission URL (Required)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project or deployed link"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition ${currentStyles.input}`}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${currentStyles.subText}`}>
                  Attach File (Optional)
                </label>
                <div className={`relative rounded-xl border-2 border-dashed transition ${uploadedFile
                  ? isDark ? "border-emerald-500/40 bg-emerald-500/5" : "border-emerald-500/40 bg-emerald-50"
                  : isDark ? "border-slate-700 bg-slate-800/50 hover:border-slate-600" : "border-slate-300 bg-slate-50 hover:border-slate-400"
                  }`}>
                  <input
                    type="file"
                    id={`file-upload-${project.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (max 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                          alert("File size must be less than 10MB");
                          return;
                        }
                        setUploadedFile(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png"
                  />
                  <div className="px-4 py-4 text-center">
                    {uploadedFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-5 h-5 text-emerald-400" />
                          <div className="text-left">
                            <p className={`text-sm font-medium ${currentStyles.mainText}`}>
                              {uploadedFile.name}
                            </p>
                            <p className={`text-xs ${currentStyles.subText}`}>
                              {(uploadedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setUploadedFile(null);
                            const input = document.getElementById(`file-upload-${project.id}`) as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className={`p-2 rounded-lg transition ${isDark
                            ? "hover:bg-slate-700 text-slate-400"
                            : "hover:bg-slate-200 text-slate-600"}`}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${currentStyles.subText}`} />
                        <p className={`text-sm font-medium ${currentStyles.mainText}`}>
                          Click to upload or drag and drop
                        </p>
                        <p className={`text-xs ${currentStyles.subText} mt-1`}>
                          PDF, DOC, ZIP, Images (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Description/Note */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${currentStyles.subText}`}>
                  Project Description (Optional)
                </label>
                <textarea
                  placeholder="Describe your contribution, features implemented, technologies used..."
                  rows={3}
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none resize-none transition ${currentStyles.input}`}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={onSubmit}
                disabled={!submissionUrl.trim() || isUploading}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                  : "border-blue-500/40 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                  }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Work
                  </>
                )}
              </button>

              <p className={`text-xs ${currentStyles.subText} text-center`}>
                💡 Tip: Include links to live demo, GitHub repo, and documentation
              </p>
            </div>
          )}

          {/* Approved Member Badge */}
          {isMember && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${isDark
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-emerald-500/20 border-emerald-500/40 text-emerald-600"
              }`}>
              <CheckCircle className="w-4 h-4" />
              You're an approved member
            </div>
          )}

          {/* Grade & Feedback Display - Only for students who submitted */}
          {isMember && project.submissions && (() => {
            const mySubmission = project.submissions.find(s => s.userId === userId);
            if (mySubmission && mySubmission.grade !== null && mySubmission.grade !== undefined) {
              return (
                <div className={`rounded-xl border p-4 ${isDark
                  ? "bg-purple-500/5 border-purple-500/20"
                  : "bg-purple-50 border-purple-200"
                  }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <p className={`text-sm font-semibold ${currentStyles.mainText}`}>
                      Your Grade & Feedback
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className={`text-xs uppercase tracking-wider mb-1 ${currentStyles.subText}`}>
                        Grade
                      </p>
                      <p className={`text-3xl font-bold ${currentStyles.mainText}`}>
                        {mySubmission.grade}/100
                      </p>
                    </div>
                    {mySubmission.feedback && (
                      <div>
                        <p className={`text-xs uppercase tracking-wider mb-1 ${currentStyles.subText}`}>
                          Teacher's Feedback
                        </p>
                        <p className={`text-sm ${currentStyles.mainText}`}>
                          {mySubmission.feedback}
                        </p>
                      </div>
                    )}
                    {mySubmission.status === "revision_requested" && (
                      <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${isDark
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        : "bg-amber-500/20 border-amber-500/40 text-amber-600"
                        }`}>
                        <AlertCircle className="w-4 h-4" />
                        Revision Requested - Please update your submission
                      </div>
                    )}
                    {mySubmission.gradedAt && (
                      <p className={`text-xs ${currentStyles.subText}`}>
                        Graded on {new Date(mySubmission.gradedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
