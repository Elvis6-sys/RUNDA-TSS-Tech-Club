"use client";

import { useEffect, useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X, Download, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Eye, BookOpen, FileText, Moon, Sun, Sparkles,
  Bookmark, ChevronRight, Settings
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import PDF viewer with SSR disabled (required for Electron + PDF.js)
const InlinePDFViewer = dynamic(() => import("@/components/InlinePDFViewer"), { ssr: false });

export type ResourceItem = {
  id: string;
  title: string;
  url: string | null;
  fileUrl: string | null;
  fileType: string | null;
  content: string | null;
  tierVisibility: string;
  createdAt: Date;
};

type Props = {
  resource: ResourceItem;
  open: boolean;
  onClose: () => void;
};

function isPdf(type: string | null) {
  return type === "application/pdf" || type?.includes("pdf") || false;
}
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

// Enhanced markdown renderer
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black mt-8 mb-5">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code class="rounded bg-slate-800/50 px-2 py-0.5 font-mono text-sm">$1</code>')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_m, code) =>
      `<pre class="rounded-xl border bg-slate-900/50 p-4 font-mono text-sm overflow-x-auto my-4 leading-relaxed">${code.trim()}</pre>`
    )
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 my-3 italic opacity-80">$1</blockquote>')
    .replace(/\n/g, "<br />");
}

export default function ResourceNotebookReader({ resource, open, onClose }: Props) {
  // Determine if this is a URL link resource (no file uploaded, just URL)
  const isUrlLink = !resource.fileUrl && resource.url;
  const fileUrl = resource.fileUrl ?? resource.url ?? "";
  const type = resource.fileType;

  // Debug logging
  console.log("📄 ResourceNotebookReader Debug:");
  console.log("  - Title:", resource.title);
  console.log("  - fileType:", type);
  console.log("  - fileUrl:", resource.fileUrl);
  console.log("  - url:", resource.url);
  console.log("  - isUrlLink:", isUrlLink);
  console.log("  - content:", resource.content ? `${resource.content.substring(0, 50)}...` : "null");
  console.log("  - isPdf:", isPdf(type));
  console.log("  - isDocx:", isDocx(type));

  // Enhanced state management
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("dark");
  const [fontSize, setFontSize] = useState<number>(16);
  const [zoom, setZoom] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<"reader" | "notes">("reader");
  const [personalNotes, setPersonalNotes] = useState<string>("");
  const [notesSaved, setNotesSaved] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // DOCX rendering state
  const [docxPublicUrl, setDocxPublicUrl] = useState<string>("");
  const [docxLoading, setDocxLoading] = useState<boolean>(false);
  const [docxError, setDocxError] = useState<string>("");

  // Load saved data
  useEffect(() => {
    if (resource.id) {
      const saved = localStorage.getItem(`notebook_notes_${resource.id}`);
      if (saved) setPersonalNotes(saved);

      const bookmarked = localStorage.getItem(`bookmark_${resource.id}`);
      setIsBookmarked(bookmarked === "true");
    }
  }, [resource.id]);

  // Load and get public URL for DOCX viewing
  useEffect(() => {
    const isDocxFile = isDocx(type) || (fileUrl && (fileUrl.endsWith('.docx') || fileUrl.endsWith('.odt') || fileUrl.endsWith('.doc')));

    if (!isDocxFile || !fileUrl || !open) return;

    async function getPublicUrl() {
      setDocxLoading(true);
      setDocxError("");

      try {
        console.log("🔍 Loading document with fileType:", type);
        console.log("🔗 FileURL:", fileUrl);

        // If fileUrl is a local path, convert to full URL
        let fullUrl = fileUrl;
        if (fileUrl.startsWith('/')) {
          fullUrl = `${window.location.origin}${fileUrl}`;
          console.log("🌐 Converted to full URL:", fullUrl);
        }

        const response = await fetch(`/api/resources/docx-viewer?url=${encodeURIComponent(fullUrl)}`);
        if (!response.ok) {
          console.warn("⚠️ API call failed, using direct URL");
          setDocxPublicUrl(fullUrl);
          setDocxLoading(false);
          return;
        }

        const data = await response.json();
        console.log("✅ Got public URL:", data.publicUrl);
        setDocxPublicUrl(data.publicUrl);
      } catch (error) {
        console.error("❌ Error getting public URL:", error);
        // Fallback to direct URL
        const fullUrl = fileUrl.startsWith('/') ? `${window.location.origin}${fileUrl}` : fileUrl;
        setDocxPublicUrl(fullUrl);
      } finally {
        setDocxLoading(false);
      }
    }

    getPublicUrl();
  }, [fileUrl, type, open]);

  // Save notes
  function handleSaveNotes(text: string) {
    setPersonalNotes(text);
    if (resource.id) {
      localStorage.setItem(`notebook_notes_${resource.id}`, text);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  }

  // Toggle bookmark
  function toggleBookmark() {
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    if (resource.id) {
      localStorage.setItem(`bookmark_${resource.id}`, String(newState));
    }
  }

  // Theme styles
  const isDark = theme === "dark" || (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const themeStyles = isDark ? {
    bg: "bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950",
    text: "text-slate-100",
    header: "bg-slate-900/95 backdrop-blur-xl border-slate-800/50",
    card: "bg-slate-900/70 border-slate-800/50",
    button: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white",
    buttonAlt: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    accent: "text-blue-400",
    icon: "text-blue-400",
  } : {
    bg: "bg-gradient-to-br from-white via-slate-50 to-gray-100",
    text: "text-slate-900",
    header: "bg-white/95 backdrop-blur-xl border-slate-200/50",
    card: "bg-white/70 border-slate-200/50",
    button: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
    buttonAlt: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300",
    accent: "text-blue-600",
    icon: "text-slate-700",
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md transition-opacity" />
        <Dialog.Content
          className={`fixed z-50 flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-500 ${themeStyles.bg} ${themeStyles.text} ${isFullscreen ? "inset-0 rounded-none" : "inset-4 sm:inset-8 md:inset-12 lg:inset-16 max-w-7xl"
            }`}
          style={{ margin: "auto" }}
        >
          {/* ── Header Toolbar ── */}
          <div className={`flex flex-wrap items-center justify-between gap-4 border-b px-4 sm:px-6 py-4 ${themeStyles.header}`}>

            {/* Left: Title & Actions */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-2.5 rounded-xl ${themeStyles.card} border shadow-sm`}>
                <BookOpen className={`w-5 h-5 ${themeStyles.icon}`} />
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="font-bold text-base sm:text-lg truncate leading-tight flex items-center gap-2">
                  {resource.title}
                  {isBookmarked && <Bookmark className="w-4 h-4 fill-yellow-500 text-yellow-500 animate-pulse" />}
                </Dialog.Title>
                <div className="flex items-center gap-2 text-xs opacity-75">
                  <Eye className="w-3 h-3" />
                  <span>Resource viewer</span>
                  <span>•</span>
                  <span>{new Date(resource.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center gap-2">

              {/* Tab Switcher */}
              <div className={`flex rounded-xl p-1 ${themeStyles.card} border`}>
                <button
                  onClick={() => setActiveTab("reader")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === "reader" ? themeStyles.button : "hover:bg-slate-700/50"
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Reader
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === "notes" ? themeStyles.button : "hover:bg-slate-700/50"
                    }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                  {personalNotes && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`p-2 rounded-xl transition ${themeStyles.buttonAlt}`}
                title="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Zoom Controls (for PDFs & DOCX) */}
              {(isPdf(type) || isDocx(type)) && (
                <div className={`hidden sm:flex items-center gap-1 ${themeStyles.card} rounded-xl px-2 py-1 border`}>
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    className="p-1 hover:bg-slate-700/50 rounded transition"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs min-w-[3rem] text-center">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    className="p-1 hover:bg-slate-700/50 rounded transition"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Font Size (for text content) */}
              {!isPdf(type) && !isDocx(type) && (
                <div className={`hidden sm:flex items-center gap-1 ${themeStyles.card} rounded-xl px-2 py-1 border`}>
                  <button
                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                    className="px-1.5 py-0.5 hover:bg-slate-700/50 rounded text-xs font-mono"
                  >
                    A-
                  </button>
                  <span className="font-mono text-xs px-1">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                    className="px-1.5 py-0.5 hover:bg-slate-700/50 rounded text-xs font-mono"
                  >
                    A+
                  </button>
                </div>
              )}

              {/* Bookmark */}
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-xl transition ${themeStyles.buttonAlt}`}
                title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`} />
              </button>

              {/* Download */}
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className={`p-2 rounded-xl transition ${themeStyles.button} shadow-lg`}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}

              {/* Fullscreen */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-2 rounded-xl transition ${themeStyles.buttonAlt}`}
                title="Toggle fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <Dialog.Close className={`p-2 rounded-xl transition ${themeStyles.buttonAlt}`}>
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
          </div>

          {/* ── Content Area ── */}
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* READER TAB */}
            {activeTab === "reader" && (
              <div className="flex-1 overflow-auto p-4 sm:p-8" ref={contentRef}>

                {/* URL Link Card - Show FIRST for link resources */}
                {isUrlLink && resource.url && (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <div className={`max-w-md p-8 rounded-3xl ${themeStyles.card} border shadow-xl text-center space-y-6`}>
                      <div className="flex justify-center">
                        <div className="p-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                          <Sparkles className="w-16 h-16 text-emerald-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">{resource.title}</h3>
                        <p className="text-sm opacity-75">External Resource Link</p>
                        {resource.content && (
                          <p className="text-xs opacity-60 mt-2">{resource.content}</p>
                        )}
                      </div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                      >
                        Open Resource
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* PDF Viewer - Using PDF.js for Electron compatibility */}
                {!isUrlLink && isPdf(type) && fileUrl && (
                  <div className="w-full min-h-[70vh]">
                    <InlinePDFViewer
                      url={`/api/resources/pdf?path=${encodeURIComponent(fileUrl)}`}
                    />
                  </div>
                )}

                {/* DOCX Viewer - Only for uploaded files, not links */}
                {!isUrlLink && (isDocx(type) || (fileUrl && (fileUrl.endsWith('.docx') || fileUrl.endsWith('.odt') || fileUrl.endsWith('.doc')))) && fileUrl && (
                  <div className="w-full min-h-[70vh] space-y-4">
                    {/* Header with download button */}
                    <div className={`p-4 rounded-xl ${themeStyles.card} border flex items-center justify-between flex-wrap gap-3`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Word Document</p>
                          <p className="text-xs opacity-75">
                            {docxLoading ? "Loading viewer..." : "Viewing with Google Docs"}
                          </p>
                          {type && (
                            <p className="text-xs opacity-50 font-mono mt-0.5">
                              {type.includes("odt") ? "ODT format" : "DOCX format"}
                            </p>
                          )}
                        </div>
                      </div>
                      <a
                        href={fileUrl}
                        download
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${themeStyles.button}`}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>

                    {/* Loading state */}
                    {docxLoading && (
                      <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                          <p className="text-sm opacity-75">Preparing document viewer...</p>
                        </div>
                      </div>
                    )}

                    {/* Google Docs Viewer Iframe */}
                    {!docxLoading && docxPublicUrl && (
                      <>
                        {/* Localhost warning - only in development */}
                        {docxPublicUrl.includes('localhost') || docxPublicUrl.includes('127.0.0.1') ? (
                          <div className={`mb-4 p-4 rounded-xl ${themeStyles.card} border border-blue-500/30 bg-blue-500/10`}>
                            <div className="flex items-start gap-3">
                              <div className="text-blue-400 mt-0.5 text-xl">ℹ️</div>
                              <div className="flex-1 text-sm">
                                <p className="font-semibold text-blue-400 mb-1">Local Development Mode</p>
                                <p className="opacity-90 text-xs leading-relaxed">
                                  Google Docs Viewer cannot access localhost. Click "Download & Open Locally" below or "Open in New Tab" to view the document.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div
                          className="w-full rounded-2xl overflow-hidden border shadow-2xl bg-white"
                          style={{
                            height: '80vh',
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: "top center",
                          }}
                        >
                          <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(docxPublicUrl)}&embedded=true`}
                            className="w-full h-full"
                            title={resource.title}
                            frameBorder="0"
                          />
                        </div>

                        {/* Alternative options */}
                        <div className={`p-4 rounded-xl ${themeStyles.card} border text-center`}>
                          <p className="text-sm opacity-75 mb-3">Alternative viewing options:</p>
                          <div className="flex gap-3 justify-center flex-wrap">
                            <a
                              href={fileUrl}
                              download
                              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition ${themeStyles.button} hover:scale-105`}
                            >
                              <Download className="w-4 h-4" />
                              Download & Open Locally
                            </a>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition ${themeStyles.buttonAlt} border hover:scale-105`}
                            >
                              <Eye className="w-4 h-4" />
                              Open in New Tab
                            </a>
                          </div>
                        </div>

                        {/* Warning for ODT files */}
                        {type?.includes("odt") && (
                          <div className={`p-4 rounded-xl ${themeStyles.card} border border-yellow-500/30 bg-yellow-500/10`}>
                            <div className="flex items-start gap-3">
                              <div className="text-yellow-400 mt-0.5 text-xl">⚠️</div>
                              <div className="flex-1 text-sm">
                                <p className="font-semibold text-yellow-400 mb-1">LibreOffice ODT Format Detected</p>
                                <p className="opacity-90 text-xs leading-relaxed">
                                  This file was created in LibreOffice. The viewer may not display it correctly.
                                  If the document doesn't load above, please <a href={fileUrl} download className="text-blue-400 hover:underline font-semibold">download it</a> and open with LibreOffice or convert it to proper DOCX format.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Error fallback */}
                    {docxError && !docxLoading && (
                      <div className={`p-8 rounded-2xl ${themeStyles.card} border text-center space-y-4`}>
                        <FileText className="w-16 h-16 mx-auto text-yellow-400" />
                        <div className="space-y-2">
                          <p className="font-semibold">Document Viewer Unavailable</p>
                          <p className="text-sm opacity-75">Please download the document to view it.</p>
                        </div>
                        <a
                          href={fileUrl}
                          download
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${themeStyles.button}`}
                        >
                          <Download className="w-4 h-4" />
                          Download Document
                        </a>
                      </div>
                    )}

                    {/* Help text */}
                    {!docxLoading && docxPublicUrl && (
                      <div className={`p-3 rounded-xl ${themeStyles.card} border text-center text-xs opacity-75`}>
                        <p>Document displayed with Google Docs Viewer. If it doesn't load, <a href={fileUrl} download className="text-blue-400 hover:underline">download it here</a>.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Content with Markdown - Only for pure notes (no files) */}
                {!fileUrl && resource.content && (
                  <div className="flex justify-center">
                    <div
                      className={`w-full max-w-3xl rounded-2xl p-6 sm:p-10 ${themeStyles.card} border shadow-xl`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(resource.content) }}
                      />
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isUrlLink && !fileUrl && !resource.content && (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="text-center space-y-3 opacity-60">
                      <FileText className="w-16 h-16 mx-auto" />
                      <p className="text-lg font-semibold">No content available</p>
                      <p className="text-sm">This resource doesn't have any viewable content.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === "notes" && (
              <div className="flex-1 flex flex-col p-6 sm:p-8 space-y-4 overflow-auto">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      My Study Notes
                    </h3>
                    <p className="text-xs opacity-75">
                      Personal notes for &quot;{resource.title}&quot;. Saved locally in your browser.
                    </p>
                  </div>
                  {notesSaved && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Saved
                    </span>
                  )}
                </div>

                <textarea
                  value={personalNotes}
                  onChange={(e) => handleSaveNotes(e.target.value)}
                  placeholder="Type your notes, key takeaways, formulas, or questions here...&#10;&#10;You can use markdown:&#10;- **bold text**&#10;- `code snippets`&#10;- ## Headings&#10;&#10;Notes are automatically saved!"
                  className={`flex-1 w-full rounded-xl border p-5 font-mono text-sm outline-none resize-none min-h-[50vh] transition focus:ring-2 focus:ring-blue-500/50 ${themeStyles.card}`}
                  style={{ fontSize: `${fontSize}px` }}
                />

                <div className="flex justify-between items-center text-xs opacity-75">
                  <span>{personalNotes.length} characters</span>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear all notes?")) {
                        handleSaveNotes("");
                      }
                    }}
                    className="hover:text-red-500 font-semibold transition"
                  >
                    Clear all notes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className={`px-6 py-3 border-t text-xs flex items-center justify-between ${themeStyles.header}`}>
            <div className="flex items-center gap-2 opacity-75">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rwanda TVET Tech Club · Resource Library</span>
            </div>
            <button
              onClick={() => setActiveTab(activeTab === "reader" ? "notes" : "reader")}
              className="font-semibold hover:underline flex items-center gap-1.5 transition"
            >
              {activeTab === "reader" ? (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  Open Notes
                </>
              ) : (
                <>
                  <BookOpen className="w-3.5 h-3.5" />
                  Back to Reader
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </Dialog.Root>
  );
}
