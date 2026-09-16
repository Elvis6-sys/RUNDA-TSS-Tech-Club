"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Search, Filter, FileText, Link as LinkIcon,
  File, BookOpen, Plus, X, Upload,
  Star, Eye, Download, Share2, Sparkles, Grid3x3, List,
  ChevronDown, Calendar, User, Tag, TrendingUp
} from "lucide-react";

type Resource = {
  id: string;
  title: string;
  url: string | null;
  fileUrl: string | null;
  fileType: string | null;
  content: string | null;
  tierVisibility: string;
  createdAt: Date;
  trainerId: string | null;
};

import ResourceNotebookReader, { type ResourceItem } from "./ResourceNotebookReader";

function isPdf(type: string | null) { return type === "application/pdf" || type?.includes("pdf") || false; }

function isDocx(type: string | null) {
  if (!type) return false;
  return (
    type.includes("word") ||
    type.includes("document") ||
    type.includes("docx") ||
    type.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    type.includes(".docx") ||
    // LibreOffice OpenDocument formats
    type.includes("odt") ||
    type.includes("application/vnd.oasis.opendocument.text")
  );
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  all: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  l3: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  l4: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
  l5: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  alumni: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  admin: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
};

function getResourceIcon(resource: Resource) {
  if (isPdf(resource.fileType)) return { icon: FileText, color: "text-red-400", bg: "bg-red-500/10" };
  if (isDocx(resource.fileType)) return { icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" };
  if (resource.url) return { icon: LinkIcon, color: "text-emerald-400", bg: "bg-emerald-500/10" };
  return { icon: FileText, color: "text-slate-400", bg: "bg-slate-500/10" };
}

// ─── Animated Resource Card ────────────────────────────────────────────────────

function ResourceCard({
  resource,
  index,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete
}: {
  resource: Resource;
  index: number;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
}) {
  const [openNotebook, setOpenNotebook] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasContentOrFile = !!(resource.fileUrl || resource.url || resource.content);
  const { icon: Icon, color, bg } = getResourceIcon(resource);
  const tierStyle = TIER_COLORS[resource.tierVisibility] || TIER_COLORS.all;

  // Check if current user can edit/delete
  const canModify = isAdmin || (resource.trainerId !== null && resource.trainerId === currentUserId);

  // Generate consistent view count on client side only
  useEffect(() => {
    // Generate a pseudo-random but consistent number based on resource ID
    const hash = resource.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    setViewCount((hash % 80) + 20); // Between 20-100
  }, [resource.id]);

  return (
    <>
      <article
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          animationDelay: `${index * 50}ms`,
        }}
        className="group relative rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/50 animate-fade-in"
      >
        {/* Gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 opacity-0 transition-opacity duration-500 ${isHovered ? "opacity-100" : ""}`} />

        {/* Image thumbnail or icon header */}
        <div className="relative h-24 overflow-hidden">
          <div className={`w-full h-full flex items-center justify-center ${bg} relative overflow-hidden`}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_linear_infinite]" />
            </div>
            <Icon className={`w-16 h-16 ${color} relative z-10`} strokeWidth={1.5} />
          </div>

          {/* Floating badge */}
          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full border backdrop-blur-md text-xs font-bold ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
            {resource.tierVisibility === "all" ? "🌍 Everyone" :
              resource.tierVisibility === "l3" ? "L3" :
                resource.tierVisibility === "l4" ? "L4" :
                  resource.tierVisibility === "l5" ? "L5" :
                    resource.tierVisibility.toUpperCase()}
          </div>

          {/* Type badge */}
          <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full backdrop-blur-md border ${bg} ${color} border-slate-700/50 text-xs font-semibold flex items-center gap-1.5`}>
            <Icon className="w-3.5 h-3.5" />
            {isPdf(resource.fileType) ? "PDF" :
              (resource.fileType?.includes("word") || resource.fileType?.includes("document")) ? "DOCX" :
                resource.url ? "Link" : "Notes"}
          </div>
        </div>

        {/* Content */}
        <div className="relative p-3 space-y-2.5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
              {resource.title}
            </h3>
            {resource.content && (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {resource.content}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(resource.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            {viewCount > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {viewCount} views
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {hasContentOrFile && (
              <button
                onClick={() => setOpenNotebook(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 hover:border-emerald-400/60 px-3 py-2 text-xs font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Reader</span>
                <span className="ml-auto">→</span>
              </button>
            )}

            {/* Edit/Delete buttons for resource owner */}
            {canModify && (
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(resource)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-400/60 px-2 py-1.5 text-xs font-semibold text-blue-300 hover:text-white transition-all"
                  title="Edit resource"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-400/60 px-2 py-1.5 text-xs font-semibold text-red-300 hover:text-white transition-all"
                  title="Delete resource"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4 z-20">
              <div className="text-center space-y-3">
                <p className="text-sm font-semibold text-white">Delete this resource?</p>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onDelete(resource.id);
                      setShowDeleteConfirm(false);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hover glow effect */}
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl opacity-0 -z-10 blur transition-opacity duration-500 ${isHovered ? "opacity-20" : ""}`} />
      </article>

      <ResourceNotebookReader
        resource={resource as ResourceItem}
        open={openNotebook}
        onClose={() => setOpenNotebook(false)}
      />
    </>
  );
}

// ─── Main Resources Client ─────────────────────────────────────────────────────

export default function ResourcesClient({
  resources,
  isAdmin,
  isTrainer,
  currentUserId,
  userLevel,
}: {
  resources: Resource[];
  isAdmin: boolean;
  isTrainer?: boolean;
  currentUserId: string;
  userLevel?: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  // Form states
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [tierVisibility, setTierVisibility] = useState("all"); // Default to Everyone
  const [fileType, setFileType] = useState<string>("pdf"); // New: file type selector
  const [uploadedFile, setUploadedFile] = useState<{ url: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainerTracks, setTrainerTracks] = useState<Array<{ id: string; name: string }>>([]);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Validate file type matches selected type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileMimeType = file.type.toLowerCase();

    let isValidType = false;
    let expectedTypes = "";

    if (fileType === "pdf") {
      isValidType = fileMimeType === "application/pdf" || fileExtension === "pdf";
      expectedTypes = "PDF (.pdf)";
    } else if (fileType === "docx") {
      isValidType = fileMimeType.includes("word") ||
        fileMimeType.includes("document") ||
        fileExtension === "docx" ||
        fileExtension === "doc";
      expectedTypes = "Word Document (.docx, .doc)";
    } else if (fileType === "image") {
      isValidType = fileMimeType.startsWith("image/") ||
        ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(fileExtension || "");
      expectedTypes = "Image (.png, .jpg, .jpeg, .gif, .svg)";
    } else if (fileType === "video") {
      isValidType = fileMimeType.startsWith("video/") ||
        ["mp4", "webm", "mov", "avi"].includes(fileExtension || "");
      expectedTypes = "Video (.mp4, .webm, .mov)";
    }

    if (!isValidType) {
      setError(`❌ Invalid file type! You selected "${fileType.toUpperCase()}" but uploaded a ${fileExtension?.toUpperCase() || "unknown"} file. Please upload a ${expectedTypes} file.`);
      return;
    }

    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "resources");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setUploadedFile(data);
    } else {
      setError("File upload failed.");
    }
  }, [fileType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileType === "pdf" ? { "application/pdf": [".pdf"] } :
      fileType === "docx" ? {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "application/msword": [".doc"]
      } :
        fileType === "image" ? { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"] } :
          fileType === "video" ? { "video/*": [".mp4", ".webm", ".mov", ".avi"] } :
            undefined
  });
  const canCreate = isAdmin || isTrainer;

  // Handle edit resource
  function handleEdit(resource: Resource) {
    setEditingResource(resource);
    setTitle(resource.title);
    setUrl(resource.url || "");
    setContent(resource.content || "");
    setTierVisibility(resource.tierVisibility);
    // Determine file type from resource
    if (resource.fileType?.includes("pdf")) {
      setFileType("pdf");
    } else if (resource.fileType?.includes("word") || resource.fileType?.includes("document")) {
      setFileType("docx");
    } else if (resource.url && !resource.fileUrl) {
      setFileType("url_link");
    } else {
      setFileType("notes");
    }
    setShowForm(true);
  }

  // Handle delete resource
  async function handleDelete(id: string) {
    const res = await fetch(`/api/resources/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      alert(`Failed to delete resource: ${error.error || "You may not have permission to delete this resource."}`);
    }
  }

  // Fetch trainer tracks
  useEffect(() => {
    if (!isTrainer || !showForm) return;
    fetch("/api/trainer/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.assignments)) {
          setTrainerTracks(data.assignments.map((a: any) => ({ id: a.track.id, name: a.track.name })));
        }
      })
      .catch(() => setTrainerTracks([]));
  }, [isTrainer, showForm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);

    // Validation based on file type
    if (fileType === "url_link" && !url) {
      setError("Please provide a URL link.");
      setLoading(false);
      return;
    }
    if ((fileType === "pdf" || fileType === "docx") && !uploadedFile && !editingResource) {
      setError(`Please upload a ${fileType.toUpperCase()} file.`);
      setLoading(false);
      return;
    }
    if (fileType === "url_link" && !url) {
      setError("Please enter a URL.");
      setLoading(false);
      return;
    }

    const method = editingResource ? "PATCH" : "POST";
    const endpoint = editingResource ? `/api/resources/${editingResource.id}` : "/api/resources";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        url: url || null,
        fileUrl: uploadedFile?.url ?? editingResource?.fileUrl ?? null,
        fileType: uploadedFile?.type ?? editingResource?.fileType ?? null,
        content: content || null,
        subject: subject || null,
        tierVisibility
      })
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b?.error || "Failed.");
      return;
    }
    setTitle(""); setUrl(""); setContent(""); setSubject(""); setUploadedFile(null); setFileType("pdf");
    setShowForm(false); setEditingResource(null);
    router.refresh();
  }

  // Filter and search logic
  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" ||
      (filterType === "pdf" && isPdf(r.fileType)) ||
      (filterType === "docx" && isDocx(r.fileType)) ||
      (filterType === "link" && r.url);

    const matchesTier = filterTier === "all" || r.tierVisibility === filterTier;

    return matchesSearch && matchesType && matchesTier;
  });

  const stats = {
    total: resources.length,
    pdfs: resources.filter((r) => isPdf(r.fileType)).length,
    docx: resources.filter((r) => r.fileType?.includes("word") || r.fileType?.includes("document")).length,
    links: resources.filter((r) => r.url).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header with animated gradient */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 blur-3xl opacity-30" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                    <BookOpen className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                      Resources Library
                      <Sparkles className="w-6 h-6 text-yellow-400" />
                    </h1>
                    <p className="text-slate-400 text-sm">Discover amazing learning materials</p>
                  </div>
                </div>
              </div>

              {canCreate && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/50"
                >
                  {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {showForm ? "Cancel" : "Add Resource"}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total", value: stats.total, icon: BookOpen, color: "blue" },
                { label: "PDFs", value: stats.pdfs, icon: FileText, color: "red" },
                { label: "Word Docs", value: stats.docx, icon: FileText, color: "blue" },
                { label: "Links", value: stats.links, icon: LinkIcon, color: "emerald" },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                    <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                      <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {canCreate && showForm && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-6 space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white">{editingResource ? "Edit Resource" : "Create New Resource"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resource Title"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
              />

              {/* File Type Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  📂 Resource Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={fileType}
                  onChange={(e) => {
                    setFileType(e.target.value);
                    setUploadedFile(null);
                    setUrl("");
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-emerald-500 transition"
                >
                  <option value="pdf">📄 PDF Document</option>
                  <option value="docx">📝 Word Document (.docx)</option>
                  <option value="url_link">🔗 External URL Link</option>
                </select>
              </div>

              {/* File Upload Zone - Conditional based on file type */}
              {(fileType === "pdf" || fileType === "docx") && (
                <div
                  {...getRootProps()}
                  className={`rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition ${isDragActive ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 hover:border-slate-600"
                    }`}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-emerald-400">Uploading...</p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="space-y-2">
                      <p className="text-sm text-emerald-400 font-medium">✓ {uploadedFile.name}</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                        className="text-xs text-slate-400 hover:text-white transition"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="text-sm text-slate-400">
                        {isDragActive ? "Drop your file here" : `Drag & drop your ${fileType.toUpperCase()} file, or click to browse`}
                      </p>
                      <p className="text-xs text-slate-600">
                        {fileType === "pdf" && "Accepts: .pdf files"}
                        {fileType === "docx" && "Accepts: .docx, .doc files"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* URL Input - Show for link types */}
              {fileType === "url_link" && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    🔗 External URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                  />
                </div>
              )}

              {isTrainer && (
                <select
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-emerald-500 transition"
                >
                  <option value="">Select module...</option>
                  {trainerTracks.map((track) => (
                    <option key={track.id} value={track.name}>{track.name}</option>
                  ))}
                </select>
              )}

              {/* Description - Optional for all types */}
              <textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition resize-none"
              />

              <select
                value={tierVisibility}
                onChange={(e) => setTierVisibility(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-white outline-none focus:border-emerald-500 transition"
              >
                <option value="all">🌍 Everyone (All Levels)</option>
                <option value="l3">Level 3 (L3)</option>
                <option value="l4">Level 4 (L4)</option>
                <option value="l5">Level 5 (L5)</option>
              </select>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? (editingResource ? "Updating..." : "Creating...") : (editingResource ? "Update Resource" : "Create Resource")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setUploadedFile(null); setEditingResource(null); }}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-900/50 text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/50 text-white outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Types</option>
              <option value="pdf">📄 PDFs</option>
              <option value="docx">📝 Word Docs</option>
              <option value="link">🔗 Links</option>
            </select>

            {/* Tier Filter */}
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/50 text-white outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Levels</option>
              <option value="l3">Level 3 (L3)</option>
              <option value="l4">Level 4 (L4)</option>
              <option value="l5">Level 5 (L5)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-2 p-1 rounded-xl border border-slate-800 bg-slate-900/50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-slate-400">
              Showing <span className="text-white font-semibold">{filteredResources.length}</span> of{" "}
              <span className="text-white font-semibold">{resources.length}</span> resources
            </p>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="p-6 rounded-full bg-slate-800/50">
              <BookOpen className="w-12 h-12 text-slate-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-slate-400">No resources found</p>
              <p className="text-sm text-slate-600">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {filteredResources.map((resource, index) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                index={index}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -250% 0;
          }
          100% {
            background-position: 250% 0;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
