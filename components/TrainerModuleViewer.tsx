"use client";

/**
 * TrainerModuleViewer
 *
 * Full-page curriculum viewer for trainers.
 * Left: cascading TOC sidebar (outcomes → topics → subtopics)
 * Right: interactive, animated content panel for the selected item
 * Top: curriculum upload + AI TOC generation controls
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Target, Zap, FlaskConical, Wrench, Rocket, Lightbulb,
  ChevronRight, ChevronDown, Check, X, Eye,
  Upload, FileText, Cog, Sparkles, BookOpen,
  MapPin, ListChecks, Edit3, Code2, ClipboardList,
  Pin, Clock, BookMarked, Dot, Users, Folder,
  BarChart3, CheckSquare,
} from "lucide-react";
import type { TOCItem } from "@/app/api/passport/tracks/[trackId]/toc-generate/route";
import type { LearnBlock, LearnModule } from "@/lib/learnContent";
import TrainerContentEditor from "@/components/TrainerContentEditor";
import SimpleTocEditor from "@/components/SimpleTocEditor";
import dynamic from "next/dynamic";

// Dynamically import quiz components
const EnhancedQuizGradingDashboard = dynamic(() => import("@/components/EnhancedQuizGradingDashboard"), { ssr: false });
const QuizReportDashboard = dynamic(() => import("@/components/QuizReportDashboard"), { ssr: false });
const ExamPinManager = dynamic(() => import("@/components/ExamPinManager"), { ssr: false });
const InlinePDFViewer = dynamic(() => import("@/components/InlinePDFViewer"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type Resource = { id: string; title: string; fileUrl: string | null; url: string | null };
type Lesson = { id: string; title: string; order: number; tierVisibility: string };
type TrackInfo = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  tier: string;
  curriculumUrl: string | null;
  curriculumType: string | null;
  tableOfContents: TOCItem[];
};

type Props = {
  track: TrackInfo;
  lessons: Lesson[];
  resources: Resource[];
  nodeCount: number;
  moduleCode?: string;
  moduleSlug?: string | null;
  trackId: string;
  /** Server-prefetched custom TOC entries — eliminates async timing gap */
  initialCustomTocEntries?: any[];
};

// ─── Tier colours ─────────────────────────────────────────────────────────────

const TIER_COLOR: Record<string, string> = {
  l3: "from-emerald-500 to-teal-600",
  l4: "from-sky-500 to-blue-600",
  l5: "from-violet-500 to-purple-700",
  all: "from-slate-500 to-slate-700",
};

// ─── TOC Color Schemes for Each Level ────────────────────────────────────────

// Learning Outcome - Blue theme 💙
const LO_COLORS = {
  text: "text-blue-300",
  textHover: "hover:text-blue-200",
  textActive: "text-blue-50",
  bg: "bg-blue-500/10",
  bgHover: "hover:bg-blue-500/20",
  bgActive: "bg-blue-500/30",
  border: "border-blue-500/30",
  borderHover: "hover:border-blue-400/50",
  borderActive: "border-blue-400/70",
  icon: "text-blue-400",
};

// Indicative Content / Topic - Green theme 💚
const TOPIC_COLORS = {
  text: "text-green-300",
  textHover: "hover:text-green-200",
  textActive: "text-green-50",
  bg: "bg-green-500/10",
  bgHover: "hover:bg-green-500/20",
  bgActive: "bg-green-500/30",
  border: "border-green-500/30",
  borderHover: "hover:border-green-400/50",
  borderActive: "border-green-400/70",
  icon: "text-green-400",
  dot: "bg-green-400",
};

// Subtopic - Orange theme 🧡
const SUBTOPIC_COLORS = {
  text: "text-orange-300",
  textHover: "hover:text-orange-200",
  textActive: "text-orange-50",
  bg: "bg-orange-500/10",
  bgHover: "hover:bg-orange-500/20",
  bgActive: "bg-orange-500/30",
  border: "border-orange-500/30",
  borderHover: "hover:border-orange-400/50",
  borderActive: "border-orange-400/70",
  icon: "text-orange-400",
  dot: "bg-orange-400",
};

// Item - Yellow theme 💛
const ITEM_COLORS = {
  text: "text-yellow-300",
  textHover: "hover:text-yellow-200",
  textActive: "text-yellow-50",
  bg: "bg-yellow-500/10",
  bgHover: "hover:bg-yellow-500/20",
  bgActive: "bg-yellow-500/30",
  border: "border-yellow-500/30",
  borderHover: "hover:border-yellow-400/50",
  borderActive: "border-yellow-400/70",
  icon: "text-yellow-400",
};

const TIER_BADGE: Record<string, string> = {
  l3: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  l4: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  l5: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  all: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

// ─── Outcome icon by index ────────────────────────────────────────────────────

const OUTCOME_ICON_ELS = [
  <Target className="w-4 h-4" />,
  <Zap className="w-4 h-4" />,
  <FlaskConical className="w-4 h-4" />,
  <Wrench className="w-4 h-4" />,
  <Rocket className="w-4 h-4" />,
  <Lightbulb className="w-4 h-4" />,
];

// ─── Upload + TOC generation panel ───────────────────────────────────────────

function CurriculumUploadPanel({
  trackId,
  curriculumUrl,
  onGenerated,
}: {
  trackId: string;
  curriculumUrl: string | null;
  onGenerated: (toc: TOCItem[], source: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newUrl, setNewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const activeUrl = newUrl ?? curriculumUrl;

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true); setError(null); setStatus(null);
    const form = new FormData();
    form.append("file", file);
    form.append("bucket", "resources");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) { setError("Upload failed. Try again."); return; }
    const { url, type } = await res.json();
    // Save URL to track
    await fetch(`/api/passport/tracks/${trackId}/curriculum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curriculumUrl: url, curriculumType: type }),
    });
    setNewUrl(url);
    setStatus("Curriculum uploaded. Click Generate TOC");
  }, [trackId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/msword": [".doc"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
  });

  async function handleGenerate() {
    setGenerating(true); setError(null); setStatus(null);

    // Step 1: Extract PDF text if curriculum URL exists
    let curriculumText = "";
    let moduleCode = "";

    if (activeUrl) {
      setStatus("Extracting text from PDF...");
      const extractRes = await fetch(`/api/passport/tracks/${trackId}/extract-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (extractRes.ok) {
        const extractData = await extractRes.json();
        curriculumText = extractData.text;
        moduleCode = extractData.moduleCode;
        console.log(`[TOC] Extracted ${extractData.characterCount} chars from ${extractData.extractedPages} pages`);
        setStatus(`Extracted ${extractData.extractedPages} pages, generating TOC...`);
      } else {
        console.warn("[TOC] PDF extraction failed, will try static/skeleton fallback");
      }
    }

    // Step 2: Generate TOC (will use static, AI, or skeleton based on what's available)
    // Add 30 second timeout to prevent infinite hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`/api/passport/tracks/${trackId}/toc-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curriculumText, moduleCode }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setGenerating(false);

      if (!res.ok) {
        setError("TOC generation failed.");
        return;
      }

      const { toc, source } = await res.json();
      const sourceLabel = source === "ai" ? "AI-generated" : source === "static" ? "built-in curriculum" : source === "parsed" ? "PDF content" : "template";
      setStatus(`Table of Contents generated from ${sourceLabel}`);
      onGenerated(toc, source);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setGenerating(false);
      if (err.name === 'AbortError') {
        setError("TOC generation timed out after 30 seconds. Please try again.");
      } else {
        setError("TOC generation failed: " + err.message);
      }
      console.error("[TOC] Generation error:", err);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-slate-300 shrink-0" />
        <div>
          <h3 className="font-semibold text-white text-sm">Module Curriculum</h3>
          <p className="text-xs text-slate-400">Upload PDF/DOCX → Generate smart Table of Contents</p>
        </div>
        {activeUrl && (
          <a href={activeUrl} target="_blank" rel="noreferrer"
            className="ml-auto text-xs px-3 py-1.5 rounded-xl border border-violet-500/40 text-violet-300 hover:bg-violet-500/10 transition shrink-0">
            View PDF ↗
          </a>
        )}
      </div>

      <div {...getRootProps()} className={`rounded-xl border-2 border-dashed px-4 py-5 text-center cursor-pointer transition ${isDragActive ? "border-violet-500 bg-violet-500/10" : "border-slate-700 hover:border-violet-500/50"
        }`}>
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-sm text-violet-400 animate-pulse">Uploading…</p>
        ) : activeUrl ? (
          <p className="flex items-center gap-1.5 text-sm text-emerald-400"><Check className="w-4 h-4" /> Curriculum uploaded — drop a new file to replace</p>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-center"><FileText className="w-8 h-8 text-slate-500" /></div>
            <p className="text-sm text-slate-400">{isDragActive ? "Drop it here!" : "Drag & drop curriculum PDF/DOCX, or click to browse"}</p>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 shadow-lg shadow-violet-900/40"
      >
        {generating ? (
          <><Cog className="w-4 h-4 animate-spin" /> Generating TOC…</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate Table of Contents</>
        )}
      </button>

      {status && <p className="text-xs text-emerald-400 text-center">{status}</p>}
      {error && <p className="text-xs text-rose-400 text-center">{error}</p>}
    </div>
  );
}

// ─── TOC Sidebar ─────────────────────────────────────────────────────────────

function TOCSidebar({
  toc,
  activeId,
  viewedIds,
  onSelect,
  tierColor,
}: {
  toc: TOCItem[];
  activeId: string | null;
  viewedIds: Set<string>;
  onSelect: (item: TOCItem) => void;
  tierColor: string;
}) {
  const outcomes = toc.filter(t => t.type === "outcome");
  const [openOutcomes, setOpenOutcomes] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(outcomes.map((o, i) => [o.id, i === 0]))
  );
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});
  const [openSubtopics, setOpenSubtopics] = useState<Record<string, boolean>>({});

  function toggleOutcome(id: string) {
    setOpenOutcomes(p => ({ ...p, [id]: !p[id] }));
  }
  function toggleTopic(id: string) {
    setOpenTopics(p => ({ ...p, [id]: !p[id] }));
  }
  function toggleSubtopic(id: string) {
    setOpenSubtopics(p => ({ ...p, [id]: !p[id] }));
  }

  const topicsFor = (parentId: string) => toc.filter(t => t.type === "topic" && t.parentId === parentId);
  const subtopicsFor = (parentId: string) => toc.filter(t => t.type === "subtopic" && t.parentId === parentId);

  // Outcome completion: % of its subtopics viewed
  function outcomePct(outcomeId: string): number {
    const subs = toc.filter(t => t.type === "subtopic" && (() => {
      const topic = toc.find(tp => tp.id === t.parentId);
      return topic?.parentId === outcomeId;
    })());
    if (!subs.length) return viewedIds.has(outcomeId) ? 100 : 0;
    const done = subs.filter(s => viewedIds.has(s.id)).length;
    return Math.round((done / subs.length) * 100);
  }

  if (toc.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-slate-500 text-sm">
        No table of contents yet.<br />
        <span className="text-xs">Upload curriculum and generate TOC →</span>
      </div>
    );
  }

  return (
    <nav className="py-3 space-y-1">
      {outcomes.map((outcome, oi) => {
        const topics = topicsFor(outcome.id);
        const isOpen = openOutcomes[outcome.id];
        const isActive = activeId === outcome.id;
        const oPct = outcomePct(outcome.id);
        const oDone = oPct >= 100;

        return (
          <div key={outcome.id}>
            {/* Learning Outcome row - Blue Theme 💙 */}
            <button
              onClick={() => { onSelect(outcome); toggleOutcome(outcome.id); }}
              className={`w-full text-left flex items-start gap-2.5 px-4 py-2.5 rounded-xl mx-2 transition group border ${isActive
                ? `${LO_COLORS.bgActive} ${LO_COLORS.borderActive} ${LO_COLORS.textActive} shadow-lg shadow-blue-500/20`
                : `${LO_COLORS.bg} ${LO_COLORS.border} ${LO_COLORS.text} ${LO_COLORS.bgHover}`
                }`}
              style={{ width: "calc(100% - 1rem)" }}
            >
              <span className={`mt-0.5 shrink-0 ${LO_COLORS.icon}`}>{OUTCOME_ICON_ELS[oi % OUTCOME_ICON_ELS.length]}</span>
              <span className="flex-1 text-xs font-bold leading-snug">{outcome.title}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {outcome.hours && (
                  <span className="text-[9px] font-mono opacity-60">{outcome.hours}h</span>
                )}
                {/* Mini progress arc for outcome */}
                {oPct > 0 && (
                  <span className={`text-[9px] font-bold ${oDone ? "text-emerald-400" : "text-amber-400"}`}>
                    {oDone ? <Check className="w-3 h-3" /> : `${oPct}%`}
                  </span>
                )}
                <ChevronRight className={`w-3 h-3 ${LO_COLORS.icon} transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </div>
            </button>

            {/* Thin progress bar under outcome row */}
            {oPct > 0 && (
              <div className="mx-6 mb-1 h-[2px] rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${oDone ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${oPct}%` }}
                />
              </div>
            )}

            {/* Topics */}
            {isOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                {topics.map((topic) => {
                  const subs = subtopicsFor(topic.id);
                  const isTopicOpen = openTopics[topic.id];
                  const isTopicActive = activeId === topic.id;
                  const topicViewed = viewedIds.has(topic.id);
                  const subsViewed = subs.filter(s => viewedIds.has(s.id)).length;

                  return (
                    <div key={topic.id}>
                      {/* Topic - Green Theme 💚 */}
                      <button
                        onClick={() => { onSelect(topic); if (subs.length) toggleTopic(topic.id); }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition text-xs border ${isTopicActive
                          ? `${TOPIC_COLORS.bgActive} ${TOPIC_COLORS.borderActive} ${TOPIC_COLORS.textActive} font-semibold shadow-sm shadow-green-500/10`
                          : `${TOPIC_COLORS.bg} ${TOPIC_COLORS.border} ${TOPIC_COLORS.text} ${TOPIC_COLORS.bgHover} ${TOPIC_COLORS.textHover}`
                          }`}
                      >
                        {/* Viewed dot */}
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${topicViewed ? TOPIC_COLORS.dot : "bg-slate-700"}`} />
                        <span className="flex-1 leading-snug">{topic.title}</span>
                        {subs.length > 0 && (
                          <span className="text-[9px] text-slate-600 shrink-0">
                            {subsViewed}/{subs.length}
                          </span>
                        )}
                        {subs.length > 0 && (
                          <ChevronRight className={`w-2.5 h-2.5 ${TOPIC_COLORS.icon} shrink-0 transition-transform ${isTopicOpen ? "rotate-90" : ""}`} />
                        )}
                      </button>

                      {/* Subtopics */}
                      {isTopicOpen && subs.map((sub) => {
                        const subViewed = viewedIds.has(sub.id);
                        // Check for items in legacy format (string array in sub.items)
                        const legacyItems = sub.items && sub.items.length > 0;
                        const hasItems = legacyItems;
                        const subExpanded = openSubtopics[sub.id] || false;

                        return (
                          <div key={sub.id}>
                            {/* Subtopic - Orange Theme 🧡 */}
                            <button
                              onClick={() => {
                                onSelect(sub);
                                if (hasItems) toggleSubtopic(sub.id);
                              }}
                              className={`w-full text-left flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-lg transition text-[11px] border ${activeId === sub.id
                                ? `${SUBTOPIC_COLORS.bgActive} ${SUBTOPIC_COLORS.borderActive} ${SUBTOPIC_COLORS.textActive} font-medium shadow-sm shadow-orange-500/10`
                                : `${SUBTOPIC_COLORS.bg} ${SUBTOPIC_COLORS.border} ${SUBTOPIC_COLORS.text} ${SUBTOPIC_COLORS.textHover}`
                                }`}
                            >
                              {/* Completion dot */}
                              <span className={`shrink-0 w-1 h-1 rounded-full ${subViewed ? "bg-emerald-400" : "bg-slate-700"}`} />
                              <span className="flex-1 leading-snug">{sub.title}</span>
                              {hasItems && (
                                <span className="text-[9px] text-slate-600 shrink-0">
                                  {sub.items?.length || 0}
                                </span>
                              )}
                              {hasItems && (
                                <ChevronRight className={`w-2.5 h-2.5 ${SUBTOPIC_COLORS.icon} shrink-0 transition-transform ${subExpanded ? "rotate-90" : ""}`} />
                              )}
                              {!hasItems && subViewed && <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
                            </button>

                            {/* Items (4th level) - Yellow Theme 💛 */}
                            {subExpanded && hasItems && (
                              <div className="ml-4 mt-0.5 space-y-0.5">
                                {/* Render legacy string array items */}
                                {sub.items && sub.items.map((itemText, itemIdx) => {
                                  // Generate consistent item ID matching the format used in mapping
                                  const outIdx = outcomes.findIndex(o => o.id === outcome.id);
                                  const topicIdx = topics.findIndex(t => t.id === topic.id);
                                  const subIdx = subs.findIndex(s => s.id === sub.id);
                                  const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;
                                  const isItemActive = activeId === itemId;

                                  return (
                                    <button
                                      key={itemIdx}
                                      onClick={() => {
                                        // Create a pseudo TOCItem for this item
                                        const itemObj = {
                                          id: itemId,
                                          type: 'subtopic' as const, // Treat as subtopic for compatibility
                                          title: itemText,
                                          parentId: sub.id,
                                          items: [], // No sub-items under items
                                          _isItem: true,  // Flag to identify as virtual item
                                          _parentSubtopic: sub,  // Store parent subtopic reference
                                        };
                                        onSelect(itemObj as any);
                                      }}
                                      className={`w-full text-left flex items-start gap-1.5 pl-7 pr-3 py-1 rounded-lg transition text-[10px] leading-snug border ${isItemActive
                                        ? `${ITEM_COLORS.bgActive} ${ITEM_COLORS.borderActive} ${ITEM_COLORS.textActive} shadow-sm shadow-yellow-500/10`
                                        : `${ITEM_COLORS.bg} ${ITEM_COLORS.border} ${ITEM_COLORS.text} ${ITEM_COLORS.textHover}`
                                        }`}
                                    >
                                      <Dot className="w-4 h-4 shrink-0 mt-0.5" />
                                      <span className="flex-1">{itemText}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Student Preview Panel — inline iframe viewer ────────────────────────────

function StudentPreviewPanel({ moduleSlug, trackId, tier }: { moduleSlug?: string; trackId?: string; tier: string }) {
  const [open, setOpen] = useState(false);
  const previewUrl = moduleSlug ? `/learn/${moduleSlug}` : trackId ? `/learn/track/${trackId}` : null;

  if (!previewUrl) return null;

  return (
    <div className="rounded-2xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-900/60 hover:bg-slate-800/60 transition"
      >
        <div className="flex items-center gap-2.5">
          <Eye className="w-4 h-4" />
          <div className="text-left">
            <p className="text-xs font-bold text-slate-200">Preview student view</p>
            <p className="text-[11px] text-slate-500">See exactly how students experience this module</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
          >
            ↗ New tab
          </a>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="relative bg-slate-950 border-t border-slate-800" style={{ height: "60vh" }}>
          {/* Toolbar */}
          <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${tier} text-white font-bold`}>
              STUDENT VIEW
            </span>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe
            src={`/learn/${moduleSlug}`}
            className="w-full h-full border-0"
            title="Student view preview"
          />
        </div>
      )}
    </div>
  );
}

// ─── Mermaid Diagram Component ────────────────────────────────────────────────

function MermaidDiagram({ code }: { code: string }) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramSvg, setDiagramSvg] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && code) {
      // Simple ASCII art fallback for now (mermaid.js adds 200KB+ to bundle)
      // In production, you'd use mermaid.js library
      const asciiDiagram = code
        .replace(/graph\s+(LR|TD|TB);?/gi, '')
        .replace(/-->/g, '→')
        .replace(/\|([^\|]+)\|/g, '[$1]')
        .trim();
      setDiagramSvg(asciiDiagram);
    }
  }, [code]);

  if (!diagramSvg) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-950 to-slate-900 rounded-xl p-6 my-6 border-2 border-emerald-500/30 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-emerald-400 text-sm font-bold">📊 LEARNING PATHWAY</span>
      </div>
      <pre className="overflow-x-auto text-emerald-300 font-mono text-sm leading-relaxed whitespace-pre">
        {diagramSvg}
      </pre>
    </div>
  );
}

// ─── Interactive Quiz Component ───────────────────────────────────────────────

function InteractiveQuiz({ questions, blockId }: { questions: any[]; blockId: string }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  const score = questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
  }, 0);

  return (
    <div className="my-6 rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold text-white text-xl flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          Interactive Quiz
        </h4>
        {showResults && (
          <div className="text-lg font-bold text-white bg-purple-600 px-4 py-2 rounded-full">
            Score: {score}/{questions.length}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q: any, qIdx: number) => {
          const isAnswered = selectedAnswers[qIdx] !== undefined;
          const isCorrect = selectedAnswers[qIdx] === q.correctAnswer;

          return (
            <div
              key={qIdx}
              className={`bg-slate-900/60 rounded-xl p-5 border-2 transition ${showResults
                ? isCorrect
                  ? 'border-emerald-500/50'
                  : 'border-red-500/50'
                : 'border-slate-700'
                }`}
            >
              <p className="text-white font-semibold text-lg mb-4">
                {qIdx + 1}. {q.question}
              </p>

              <div className="space-y-3">
                {q.options?.map((opt: string, optIdx: number) => {
                  const isSelected = selectedAnswers[qIdx] === optIdx;
                  const isThisCorrect = q.correctAnswer === optIdx;

                  let bgColor = 'bg-slate-800/50 border-slate-600';
                  let hoverColor = 'hover:bg-slate-700/50';

                  if (showResults) {
                    if (isThisCorrect) {
                      bgColor = 'bg-emerald-500/20 border-emerald-500';
                    } else if (isSelected && !isThisCorrect) {
                      bgColor = 'bg-red-500/20 border-red-500';
                    }
                    hoverColor = '';
                  } else if (isSelected) {
                    bgColor = 'bg-purple-500/30 border-purple-500';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => !showResults && handleSelectAnswer(qIdx, optIdx)}
                      disabled={showResults}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition ${bgColor} ${hoverColor} ${showResults ? 'cursor-default' : 'cursor-pointer'
                        }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                          ? 'border-white bg-white'
                          : 'border-slate-400'
                          }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                        )}
                      </div>
                      <span
                        className={`text-left flex-1 ${isSelected ? 'text-white font-medium' : 'text-slate-300'
                          }`}
                      >
                        {opt}
                      </span>
                      {showResults && isThisCorrect && (
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      )}
                      {showResults && isSelected && !isThisCorrect && (
                        <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {showResults && q.explanation && (
                <div className="mt-4 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded">
                  <p className="text-sm text-blue-200">
                    <span className="font-bold">💡 Explanation:</span> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-6">
        {!showResults ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length !== questions.length}
            className={`px-6 py-3 rounded-xl font-bold text-white transition ${Object.keys(selectedAnswers).length === questions.length
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
              : 'bg-slate-700 cursor-not-allowed opacity-50'
              }`}
          >
            Submit Answers ({Object.keys(selectedAnswers).length}/{questions.length})
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition shadow-lg"
          >
            🔄 Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Simple Block Renderer ───────────────────────────────────────────────────

// ─── Inline document viewer (teacher side) ───────────────────────────────────

function TrainerDocumentBlock({ url, title, description }: { url: string; title: string; description?: string }) {
  const [open, setOpen] = useState(false);

  // Transform URLs for Electron production: /uploads/projects/file.pdf → /api/uploads/projects/file.pdf
  let transformedUrl = url;
  if (url.startsWith('/uploads/projects/')) {
    transformedUrl = url.replace('/uploads/projects/', '/api/uploads/projects/');
  }

  const lower = transformedUrl.toLowerCase().split('?')[0];
  const isPdf = lower.endsWith('.pdf');
  const isDocx = lower.endsWith('.docx') || lower.endsWith('.doc');
  const isXlsx = lower.endsWith('.xlsx') || lower.endsWith('.xls');
  const isPptx = lower.endsWith('.pptx') || lower.endsWith('.ppt');
  const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.avi') || lower.endsWith('.mov') || lower.endsWith('.mkv');
  const isOffice = isDocx || isXlsx || isPptx;
  const icon = isPdf ? '📄' : isDocx ? '📝' : isXlsx ? '📊' : isPptx ? '📑' : isVideo ? '🎥' : '📎';
  const typeLabel = isPdf ? 'PDF' : isDocx ? 'Word' : isXlsx ? 'Spreadsheet' : isPptx ? 'Presentation' : isVideo ? 'Video' : 'Document';
  const embedSrc = isPdf
    ? (transformedUrl.startsWith('/api/uploads/')
      ? transformedUrl  // Already an API route, use directly
      : `/api/resources/pdf?path=${encodeURIComponent(transformedUrl)}`)
    : `https://docs.google.com/viewer?url=${encodeURIComponent(transformedUrl)}&embedded=true`;

  return (
    <div className="my-4 rounded-2xl border border-slate-600 bg-slate-900/70 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate">{title}</h4>
          <p className="text-slate-400 text-xs">{typeLabel}{description ? ` — ${description}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${open ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {open ? 'Close' : 'Preview Inline'}
          </button>
          <a href={transformedUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition"
            title="Open in new tab">↗</a>
        </div>
      </div>
      {open && (
        <div className="relative w-full bg-slate-950" style={{ height: '70vh' }}>
          {isPdf ? (
            /* For PDFs, use custom inline PDF viewer */
            <InlinePDFViewer url={transformedUrl} title={title} />
          ) : isVideo ? (
            /* For videos, use HTML5 video player for offline playback */
            <div className="flex flex-col items-center justify-center h-full bg-black p-4">
              <video
                src={transformedUrl}
                controls
                controlsList="nodownload"
                className="w-full h-full max-h-full rounded-lg"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                preload="metadata"
              >
                <p className="text-white">Your browser does not support video playback.</p>
              </video>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                {description && <p className="text-sm text-slate-400">{description}</p>}
                <p className="text-xs text-slate-500 mt-2">
                  💡 Supports: MP4, WebM, AVI, MOV • Works completely offline
                </p>
              </div>
            </div>
          ) : isOffice ? (
            <iframe src={embedSrc} className="w-full h-full border-0" title={title} allow="fullscreen" loading="lazy" />
          ) : (
            <iframe src={transformedUrl} className="w-full h-full border-0" title={title} loading="lazy" />
          )}
          {!isPdf && !isVideo && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center py-1 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none">
              <span className="text-[10px] text-slate-500">Scroll to read • ↗ to open full screen</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderBlock(block: LearnBlock) {
  switch (block.type) {
    case 'text':
      // Enhanced markdown rendering with proper typography
      const content = block.content || '';

      // Parse markdown to HTML
      let htmlContent = content;

      // Code blocks (do first to avoid interfering with other replacements)
      htmlContent = htmlContent.replace(
        /```mermaid\n([\s\S]*?)\n```/g,
        '<div class="bg-gradient-to-br from-emerald-950 to-slate-900 rounded-xl p-6 my-6 border-2 border-emerald-500/30 shadow-lg"><div class="flex items-center gap-2 mb-3"><span class="text-emerald-400 text-sm font-bold">📊 MERMAID DIAGRAM</span></div><pre class="overflow-x-auto"><code class="text-sm text-emerald-300 font-mono whitespace-pre leading-relaxed">$1</code></pre></div>'
      );
      htmlContent = htmlContent.replace(
        /```(\w+)?\n([\s\S]*?)\n```/g,
        '<div class="bg-slate-950 rounded-xl p-4 my-4 border border-slate-700 shadow-lg"><pre class="overflow-x-auto"><code class="text-sm text-slate-300 font-mono">$2</code></pre></div>'
      );

      // Headings
      htmlContent = htmlContent.replace(
        /^## (.+)$/gm,
        '<h2 class="text-3xl font-extrabold text-white mt-8 mb-4 tracking-tight">$1</h2>'
      );
      htmlContent = htmlContent.replace(
        /^### (.+)$/gm,
        '<h3 class="text-xl font-bold text-emerald-400 mt-6 mb-3">$1</h3>'
      );

      // Lists
      htmlContent = htmlContent.replace(
        /^\* (.+)$/gm,
        '<li class="ml-6 text-slate-300 list-disc mb-2">$1</li>'
      );

      // Wrap lists in ul
      htmlContent = htmlContent.replace(
        /(<li class="ml-6[^>]*>.*<\/li>\n?)+/g,
        (match) => `<ul class="space-y-2 my-4">${match}</ul>`
      );

      // Paragraphs (anything that's not a heading, list, or code block)
      htmlContent = htmlContent
        .split('\n\n')
        .map(para => {
          if (
            para.startsWith('<h') ||
            para.startsWith('<ul') ||
            para.startsWith('<div class="bg') ||
            para.trim() === ''
          ) {
            return para;
          }
          return `<p class="text-slate-300 leading-relaxed mb-4">${para}</p>`;
        })
        .join('\n');

      return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />;

    case 'checklist':
      return (
        <div className="my-6 rounded-xl border border-slate-700 bg-slate-900/50 p-5">
          {(block as any).title && (
            <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              {(block as any).title}
            </h4>
          )}
          <ul className="space-y-3">
            {((block as any).items || []).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-3 group">
                <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center mt-0.5 group-hover:bg-emerald-500/20 transition">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-slate-300 leading-relaxed flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'code':
      const language = (block as any).language || 'javascript';
      return (
        <div className="my-6">
          {(block as any).explanation && <p className="text-slate-400 text-sm mb-3 italic">{(block as any).explanation}</p>}
          <div className="rounded-xl overflow-hidden border border-slate-700">
            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono uppercase">{language}</span>
              <Code2 className="w-4 h-4 text-slate-500" />
            </div>
            <pre className="bg-slate-950 p-4 overflow-x-auto">
              <code className="text-sm text-emerald-400 font-mono">{(block as any).content || ''}</code>
            </pre>
          </div>
        </div>
      );

    case 'quiz':
      const questions = (block as any).questions || [];
      return (
        <InteractiveQuiz questions={questions} blockId={block.id} />
      );

    case 'video':
      const videoUrl = (block as any).url || '';
      const videoTitle = (block as any).title || 'Educational Video';
      const videoDesc = (block as any).description || '';
      const videoDuration = (block as any).duration;

      // Extract YouTube video ID
      let embedUrl = videoUrl;
      if (videoUrl.includes('youtube.com/watch?v=')) {
        const videoId = videoUrl.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }

      return (
        <div className="my-6 rounded-xl overflow-hidden border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-purple-500/5 shadow-xl">
          <div className="bg-gradient-to-r from-rose-600 to-purple-600 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <h4 className="font-bold text-white text-lg">{videoTitle}</h4>
                {videoDesc && <p className="text-white/80 text-sm">{videoDesc}</p>}
              </div>
            </div>
            {videoDuration && (
              <span className="text-white/90 text-sm font-mono bg-black/20 px-3 py-1 rounded-full">
                ⏱️ {videoDuration}
              </span>
            )}
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      );

    case 'image':
      let imageUrl = (block as any).url || '';
      const imageAlt = (block as any).alt || 'Educational Image';
      const imageCaption = (block as any).caption;

      // Transform URLs for Electron production: /uploads/projects/file.jpg → /api/uploads/projects/file.jpg
      if (imageUrl.startsWith('/uploads/projects/')) {
        imageUrl = imageUrl.replace('/uploads/projects/', '/api/uploads/projects/');
      }

      return (
        <div className="my-6 rounded-xl overflow-hidden border border-slate-700 bg-slate-900/50 shadow-lg">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto"
            onError={(e) => {
              // Fallback placeholder
              console.error('[Image] Failed to load:', imageUrl);
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23334155" width="800" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E📊 Educational Diagram%3C/text%3E%3C/svg%3E';
            }}
          />
          {imageCaption && (
            <div className="px-5 py-3 bg-slate-800/80">
              <p className="text-slate-300 text-sm italic">💡 {imageCaption}</p>
            </div>
          )}
        </div>
      );

    default:
      // Handle document type — inline viewer (same as student side)
      if ((block as any).type === 'document') {
        const docUrl = (block as any).url || '';
        const docTitle = (block as any).title || 'Module Document';
        const docDesc = (block as any).description || '';
        if (!docUrl) return (
          <div className="text-slate-400 text-sm p-4 bg-slate-900/30 rounded-lg border border-slate-700 border-dashed">
            📎 Document block — no URL set yet. Edit this block to add a file URL.
          </div>
        );
        return <TrainerDocumentBlock url={docUrl} title={docTitle} description={docDesc} />;
      }

      // Handle callout type (extended block type from database)
      if ((block as any).type === 'callout') {
        const calloutColors: Record<string, string> = {
          tip: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
          warning: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
          info: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
          danger: 'border-red-500/30 bg-red-500/5 text-red-300',
        };
        const calloutIcons: Record<string, string> = { tip: '💡', warning: '⚠️', info: 'ℹ️', danger: '🚨' };
        const calloutType = (block as any).calloutType || 'info';
        const color = calloutColors[calloutType as string] || calloutColors.info;
        const icon = calloutIcons[calloutType as string] || calloutIcons.info;
        return (
          <div className={`rounded-xl border-2 ${color} p-5 my-4`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div className="flex-1">
                {(block as any).title && <h4 className="font-bold text-white text-lg mb-2">{(block as any).title}</h4>}
                <div className="text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: (block as any).content || '' }} />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="text-slate-400 text-sm p-4 bg-slate-900/30 rounded-lg border border-slate-700">
          <span className="font-mono">Unsupported block type: {block.type}</span>
        </div>
      );
  }
}

// ─── Content Panel ────────────────────────────────────────────────────────────

function ContentPanel({
  item,
  toc,
  tierColor,
  tierbadge,
  liveBlocks,
  moduleSlug,
  dbNodeId,
  trackId,
  onEditTopic,
}: {
  item: TOCItem | null;
  toc: TOCItem[];
  tierColor: string;
  tierbadge: string;
  liveBlocks?: Record<string, LearnBlock[]>;
  moduleSlug?: string | null;
  dbNodeId?: string | null;
  trackId: string;
  onEditTopic?: (item: TOCItem) => void;
}) {

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="text-6xl mb-4"><BookOpen className="w-16 h-16 mx-auto" /></div>
        <h2 className="text-xl font-bold text-white mb-2">Select a topic from the sidebar</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          Click any learning outcome, topic or subtopic on the left to display its full content here.
        </p>
      </div>
    );
  }

  // ── Learning Outcome view ──
  if (item.type === "outcome") {
    const topics = toc.filter(t => t.type === "topic" && t.parentId === item.id);
    const outcomeIndex = toc.filter(t => t.type === "outcome").findIndex(o => o.id === item.id);

    // Block key for this outcome level
    const outcomeKey = `default-outcome-${outcomeIndex}`;
    const blocks = liveBlocks?.[outcomeKey] ?? liveBlocks?.[item.id] ?? [];
    const hasLiveContent = blocks.length > 0;

    // Attach the resolved key so handleEditTopic can find it
    const outcomeItemWithKey = { ...item, _resolvedKey: outcomeKey };

    return (
      <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Header */}
        <div className={`rounded-3xl bg-gradient-to-br ${tierColor} p-8 text-white shadow-2xl`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{OUTCOME_ICON_ELS[outcomeIndex % OUTCOME_ICON_ELS.length]}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Learning Outcome {outcomeIndex + 1}</p>
              <h1 className="text-2xl font-extrabold leading-tight">{item.title}</h1>
            </div>
          </div>
          {item.hours && (
            <div className="flex items-center gap-4 mt-4 text-sm opacity-90">
              <span>🕐 {item.hours} learning hours</span>
              <span>•</span>
              <span><BookOpen className="w-4 h-4 inline" /> {topics.length} topic{topics.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Content Blocks for Learning Outcome */}
        {hasLiveContent && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-400" /> Learning Outcome Overview
              </h2>
              {onEditTopic && (
                <button
                  onClick={() => onEditTopic({ ...item, _resolvedKey: outcomeKey } as any)}
                  className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${tierColor} px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition`}
                >
                  <Edit3 className="w-4 h-4" /> Edit content ({blocks.length} blocks)
                </button>
              )}
            </div>
            <div className="space-y-6">
              {blocks.map((block, idx) => (
                <div key={idx}>{renderBlock(block)}</div>
              ))}
            </div>
          </div>
        )}

        {/* Add content button when empty */}
        {!hasLiveContent && onEditTopic && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center">
            <p className="text-slate-400 text-sm mb-3">No overview content for this learning outcome yet.</p>
            <button
              onClick={() => onEditTopic({ ...item, _resolvedKey: outcomeKey } as any)}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r ${tierColor} text-white text-sm font-semibold hover:shadow-lg transition`}
            >
              Add Overview Content
            </button>
          </div>
        )}

        {/* Performance Criteria */}
        {item.performanceCriteria && item.performanceCriteria.length > 0 && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              <span><ListChecks className="w-4 h-4 inline" /></span> Performance Criteria
            </h2>
            <p className="text-xs text-slate-400">By the end of this outcome, you will be able to:</p>
            <ul className="space-y-2">
              {item.performanceCriteria.map((pc, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br ${tierColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                    {i + 1}
                  </span>
                  {pc}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Topics overview cards */}
        {topics.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-white flex items-center gap-2"><Pin className="w-5 h-5" /> Topics in this Outcome</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {topics.map((topic, ti) => {
                const subs = toc.filter(t => t.type === "subtopic" && t.parentId === topic.id);
                return (
                  <div key={topic.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 hover:border-slate-600 transition group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${tierColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                        {ti + 1}
                      </span>
                      <h3 className="font-semibold text-white text-sm leading-snug">{topic.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500">{subs.length} subtopic{subs.length !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Topic view ──
  if (item.type === "topic") {
    const subtopics = toc.filter(t => t.type === "subtopic" && t.parentId === item.id);
    const parentOutcome = toc.find(t => t.type === "outcome" && t.id === item.parentId);

    // Calculate indices for block key
    const outcomes = toc.filter(t => t.type === "outcome");
    const outcomeIndex = outcomes.findIndex(o => o.id === item.parentId);
    const topicsInOutcome = toc.filter(t => t.type === "topic" && t.parentId === item.parentId);
    const topicIndex = topicsInOutcome.findIndex(t => t.id === item.id);
    const topicKey = `default-topic-${outcomeIndex}-${topicIndex}`;
    const blocks = liveBlocks?.[topicKey] ?? liveBlocks?.[item.id] ?? [];
    const hasLiveContent = blocks.length > 0;

    return (
      <div className="p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Breadcrumb */}
        {parentOutcome && (
          <p className="text-xs text-slate-500">
            <span className="text-slate-400">{parentOutcome.title}</span>
            <span className="mx-2">›</span>
            <span className="text-white font-medium">{item.title}</span>
          </p>
        )}
        {/* Header */}
        <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Pin className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Indicative Content / Topic</p>
                <h1 className="text-xl font-extrabold text-white">{item.title}</h1>
              </div>
            </div>
            {onEditTopic && (
              <button
                onClick={() => onEditTopic({ ...item, _resolvedKey: topicKey } as any)}
                className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${tierColor} px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition`}
              >
                <Edit3 className="w-4 h-4" />
                {hasLiveContent ? `Edit content (${blocks.length} blocks)` : "Add content for students"}
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {subtopics.length} subtopic{subtopics.length !== 1 ? "s" : ""} — add overview content that students see when they click this topic.
          </p>
        </div>

        {/* Live content blocks */}
        {hasLiveContent && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-400" /> Topic Content
            </h2>
            {blocks.map((block, idx) => (
              <div key={idx}>{renderBlock(block)}</div>
            ))}
          </div>
        )}

        {/* No content yet nudge */}
        {!hasLiveContent && onEditTopic && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-5 text-center">
            <p className="text-slate-400 text-sm mb-3">No content yet for this topic.</p>
            <button
              onClick={() => onEditTopic({ ...item, _resolvedKey: topicKey } as any)}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r ${tierColor} text-white text-sm font-semibold hover:shadow-lg transition`}
            >
              Add Content for Students
            </button>
          </div>
        )}

        {/* Subtopics overview cards */}
        <div className="space-y-4">
          {subtopics.map((sub, si) => (
            <SubtopicCard key={sub.id} sub={sub} index={si} tierColor={tierColor} />
          ))}
          {subtopics.length === 0 && (
            <div className="rounded-xl border border-slate-800 p-6 text-center text-slate-500 text-sm">
              No subtopics defined for this topic.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Item view (4th level - NEW proper type === "item") ──
  if ((item as any).type === "item" || (item as any)._isItem) {

    const parentSub = toc.find(t => t.type === "subtopic" && t.id === item.parentId);
    const parentTopic = toc.find(t => t.type === "topic" && t.id === parentSub?.parentId);
    const parentOutcome = toc.find(t => t.type === "outcome" && t.id === parentTopic?.parentId);

    // Calculate indices for default key lookup
    const outcomes = toc.filter(t => t.type === "outcome");
    const outcomeIndex = outcomes.findIndex(o => o.id === parentOutcome?.id);
    const topics = toc.filter(t => t.type === "topic" && t.parentId === parentOutcome?.id);
    const topicIndex = topics.findIndex(t => t.id === parentTopic?.id);
    const subtopics = toc.filter(t => t.type === "subtopic" && t.parentId === parentTopic?.id);
    const subtopicIndex = subtopics.findIndex(s => s.id === parentSub?.id);
    const items = toc.filter(t => ((t as any).type === "item") && t.parentId === parentSub?.id);
    const itemIndex = items.findIndex(i => i.id === item.id);

    const defaultKey = `default-item-${outcomeIndex}-${topicIndex}-${subtopicIndex}-${itemIndex}`;

    // Get blocks for this specific item
    const blocks = liveBlocks?.[defaultKey] ?? liveBlocks?.[item.id] ?? [];
    const hasLiveContent = blocks.length > 0;

    // Debug logging
    console.log('🔍 Item Debug:', {
      itemTitle: item.title,
      defaultKey,
      blocksFound: blocks.length,
      hasLiveContent,
      blockTypes: blocks.map(b => b.type)
    });

    return (
      <div className="p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Breadcrumb */}
        <p className="text-xs text-slate-500">
          {parentOutcome && <><span className="text-slate-400">{parentOutcome.title}</span><span className="mx-2">›</span></>}
          {parentTopic && <><span className="text-slate-400">{parentTopic.title}</span><span className="mx-2">›</span></>}
          {parentSub && <><span className="text-slate-400">{parentSub.title}</span><span className="mx-2">›</span></>}
          <span className="text-white font-medium">{item.title}</span>
        </p>

        {/* Content card for curriculum item */}
        <div className={`rounded-3xl bg-gradient-to-br ${tierColor} p-0.5 shadow-2xl`}>
          <div className="rounded-[22px] bg-slate-950 p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Pin className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Level 4: Curriculum Item</p>
                  <h1 className="text-lg font-extrabold text-white">{item.title}</h1>
                </div>
              </div>
              {/* Edit button for this item */}
              {onEditTopic && (
                <button
                  onClick={() => onEditTopic(item)}
                  className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${tierColor} px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition`}
                >
                  <Edit3 className="w-4 h-4 inline" /> {hasLiveContent ? `Edit content (${blocks.length} blocks)` : "Add teaching content"}
                </button>
              )}
            </div>

            {/* Live DB blocks preview */}
            {hasLiveContent && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  Teaching content ({blocks.length} block{blocks.length !== 1 ? "s" : ""}) — visible to students
                </p>
                <div className="flex flex-wrap gap-2">
                  {blocks.map((b, i) => {
                    const iconMap = {
                      text: <FileText className="w-3 h-3 inline" />,
                      code: <Code2 className="w-3 h-3 inline" />,
                      quiz: <ClipboardList className="w-3 h-3 inline" />,
                      checklist: <ListChecks className="w-3 h-3 inline" />,
                      video: <span className="text-xs">🎬</span>,
                      image: <span className="text-xs">🖼️</span>,
                      visual: <span className="text-xs">📊</span>,
                      example: <span className="text-xs">💡</span>,
                      practice: <span className="text-xs">✍️</span>
                    };
                    const labelMap = {
                      text: "Text", code: "Code", quiz: "Quiz", checklist: "Checklist",
                      video: "Video", image: "Image", callout: "Callout",
                      visual: "visual", example: "example", practice: "practice"
                    };
                    return (
                      <span key={b.id} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 inline-flex items-center gap-1">
                        {iconMap[b.type as keyof typeof iconMap] ?? null} {labelMap[b.type as keyof typeof labelMap] ?? b.type} #{i + 1}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No content yet */}
            {!hasLiveContent && (
              <p className="text-slate-400 text-sm">
                No teaching content yet for this curriculum item.
                {onEditTopic ? " Click \"Add teaching content\" to create lessons, examples, and exercises." : ""}
              </p>
            )}
          </div>
        </div>

        {/* RENDER ACTUAL ITEM CONTENT BLOCKS */}
        {hasLiveContent && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-amber-400" /> Detailed Content
            </h2>
            <div className="space-y-6">
              {blocks.map((block, idx) => (
                <div key={idx}>
                  {renderBlock(block)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teaching tip */}
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 flex gap-3">
          <Lightbulb className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-xs font-bold text-sky-300 mb-1">Teaching Tip</p>
            <p className="text-xs text-slate-400">
              Break down this concept into simple explanations with practical examples. Add code snippets,
              practice questions, and step-by-step guides to help students master this specific topic.
            </p>
          </div>
        </div>

        {/* Student preview */}
        <StudentPreviewPanel moduleSlug={moduleSlug || undefined} trackId={trackId} tier={tierColor} />
      </div>
    );
  }

  // ── OLD Item view (for backwards compatibility) ──
  if (item.type === "subtopic" && (item as any)._isItem) {
    const itemData = item as any;
    const parentSub = itemData._parentSubtopic;
    const parentTopic = toc.find(t => t.type === "topic" && t.id === parentSub.parentId);
    const parentOutcome = toc.find(t => t.type === "outcome" && t.id === parentTopic?.parentId);

    // Get blocks for this specific item
    const blocks = liveBlocks?.[item.id] ?? [];
    const hasLiveContent = blocks.length > 0;

    return (
      <div className="p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Breadcrumb */}
        <p className="text-xs text-slate-500">
          {parentOutcome && <><span className="text-slate-400">{parentOutcome.title}</span><span className="mx-2">›</span></>}
          {parentTopic && <><span className="text-slate-400">{parentTopic.title}</span><span className="mx-2">›</span></>}
          {parentSub && <><span className="text-slate-400">{parentSub.title}</span><span className="mx-2">›</span></>}
          <span className="text-white font-medium">{item.title}</span>
        </p>

        {/* Content card for curriculum item */}
        <div className={`rounded-3xl bg-gradient-to-br ${tierColor} p-0.5 shadow-2xl`}>
          <div className="rounded-[22px] bg-slate-950 p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Pin className="w-8 h-8" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Curriculum Item</p>
                  <h1 className="text-lg font-extrabold text-white">{item.title}</h1>
                </div>
              </div>
              {/* Edit button for this item */}
              {onEditTopic && (
                <button
                  onClick={() => onEditTopic(item)}
                  className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${tierColor} px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition`}
                >
                  <Edit3 className="w-4 h-4 inline" /> {hasLiveContent ? `Edit content (${blocks.length} blocks)` : "Add teaching content"}
                </button>
              )}
            </div>

            {/* Live DB blocks preview */}
            {hasLiveContent && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  Teaching content ({blocks.length} block{blocks.length !== 1 ? "s" : ""}) — visible to students
                </p>
                <div className="flex flex-wrap gap-2">
                  {blocks.map((b, i) => {
                    const iconMap = {
                      text: <FileText className="w-3 h-3 inline" />,
                      code: <Code2 className="w-3 h-3 inline" />,
                      quiz: <ClipboardList className="w-3 h-3 inline" />,
                      checklist: <ListChecks className="w-3 h-3 inline" />
                    };
                    const labelMap = { text: "Text", code: "Code", quiz: "Quiz", checklist: "Checklist" };
                    return (
                      <span key={b.id} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 inline-flex items-center gap-1">
                        {iconMap[b.type as keyof typeof iconMap] ?? null} {labelMap[b.type as keyof typeof labelMap] ?? b.type} #{i + 1}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No content yet */}
            {!hasLiveContent && (
              <p className="text-slate-400 text-sm">
                No teaching content yet for this curriculum item.
                {onEditTopic ? " Click \"Add teaching content\" to create lessons, examples, and exercises." : ""}
              </p>
            )}
          </div>
        </div>

        {/* Teaching tip */}
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 flex gap-3">
          <Lightbulb className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-xs font-bold text-sky-300 mb-1">Teaching Tip</p>
            <p className="text-xs text-slate-400">
              Break down this concept into simple explanations with practical examples. Add code snippets,
              practice questions, and step-by-step guides to help students master this specific topic.
            </p>
          </div>
        </div>

        {/* Student preview */}
        <StudentPreviewPanel moduleSlug={moduleSlug || undefined} trackId={trackId} tier={tierColor} />
      </div>
    );
  }

  // ── Subtopic view ──
  if (item.type === "subtopic") {
    const parentTopic = toc.find(t => t.type === "topic" && t.id === item.parentId);
    const parentOutcome = toc.find(t => t.type === "outcome" && t.id === parentTopic?.parentId);

    // Calculate indices for default key lookup
    const outcomes = toc.filter(t => t.type === "outcome");
    const outcomeIndex = outcomes.findIndex(o => o.id === parentOutcome?.id);
    const topics = toc.filter(t => t.type === "topic" && t.parentId === parentOutcome?.id);
    const topicIndex = topics.findIndex(t => t.id === parentTopic?.id);
    const subtopics = toc.filter(t => t.type === "subtopic" && t.parentId === parentTopic?.id);
    const subtopicIndex = subtopics.findIndex(s => s.id === item.id);

    const defaultKey = `default-subtopic-${outcomeIndex}-${topicIndex}-${subtopicIndex}`;

    const blocks = liveBlocks?.[defaultKey] ?? liveBlocks?.[item.id] ?? ((() => {
      // Also check nodeId-based key
      if (!dbNodeId || !liveBlocks) return undefined;
      const tocSubtopics = toc.filter(t => t.type === "subtopic");
      const subIdx = tocSubtopics.findIndex(t => t.id === item.id);
      if (subIdx < 0) return undefined;
      const nodeKey = `${dbNodeId}-t${subIdx + 1}`;
      return liveBlocks[nodeKey];
    })()) ?? [];
    const hasLiveContent = blocks.length > 0;

    return (
      <div className="p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Breadcrumb */}
        <p className="text-xs text-slate-500">
          {parentOutcome && <><span className="text-slate-400">{parentOutcome.title}</span><span className="mx-2">›</span></>}
          {parentTopic && <><span className="text-slate-400">{parentTopic.title}</span><span className="mx-2">›</span></>}
          <span className="text-white font-medium">{item.title}</span>
        </p>

        {/* Content card */}
        <div className={`rounded-3xl bg-gradient-to-br ${tierColor} p-0.5 shadow-2xl`}>
          <div className="rounded-[22px] bg-slate-950 p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">◈</span>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Indicative Content</p>
                  <h1 className="text-lg font-extrabold text-white">{item.title}</h1>
                </div>
              </div>
              {/* Edit button — only shown when moduleSlug is available */}
              {onEditTopic && (
                <button
                  onClick={() => onEditTopic({ ...item, _resolvedKey: defaultKey } as any)}
                  className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${tierColor} px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition`}
                >
                  <Edit3 className="w-4 h-4 inline" /> {hasLiveContent ? `Edit content (${blocks.length} blocks)` : "Add content for students"}
                </button>
              )}
            </div>

            {/* Live DB blocks preview */}
            {hasLiveContent && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                  Live content ({blocks.length} block{blocks.length !== 1 ? "s" : ""}) — visible to students now
                </p>
                <div className="flex flex-wrap gap-2">
                  {blocks.map((b, i) => {
                    const iconMap = {
                      text: <FileText className="w-3 h-3 inline" />,
                      code: <Code2 className="w-3 h-3 inline" />,
                      quiz: <ClipboardList className="w-3 h-3 inline" />,
                      checklist: <ListChecks className="w-3 h-3 inline" />
                    };
                    const labelMap = { text: "Text", code: "Code", quiz: "Quiz", checklist: "Checklist" };
                    return (
                      <span key={b.id} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 inline-flex items-center gap-1">
                        {iconMap[b.type as keyof typeof iconMap] ?? null} {labelMap[b.type as keyof typeof labelMap] ?? b.type} #{i + 1}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Level 4 Items - Clickable */}
            {(() => {
              const level4Items = toc.filter(t => ((t as any).type === "item") && t.parentId === item.id);
              return level4Items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-amber-500">
                    Level 4 Items ({level4Items.length})
                  </p>
                  <div className="grid gap-2">
                    {level4Items.map((l4Item) => (
                      <div
                        key={l4Item.id}
                        className="text-left p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <Pin className="w-4 h-4 text-amber-400 opacity-70" />
                          <span className="text-sm text-slate-300">{l4Item.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* OLD: Curriculum items from string array (backwards compatibility) */}
            {item.items && item.items.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-emerald-500">
                  Legacy Items ({item.items.length})
                </p>
                <div className="space-y-1.5 pl-2">
                  {item.items.map((itemText, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <Dot className="w-4 h-4 mt-1 text-slate-500 shrink-0" />
                      <span>{itemText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No items */}
            {(() => {
              const level4Items = toc.filter(t => ((t as any).type === "item") && t.parentId === item.id);
              return !hasLiveContent && level4Items.length === 0 && (!item.items || item.items.length === 0) && (
                <p className="text-slate-400 text-sm">
                  No items yet.
                  {onEditTopic ? " Click \"Add content for students\" above to create engaging blocks." : ""}
                </p>
              );
            })()}
          </div>
        </div>

        {/* RENDER ACTUAL SUBTOPIC CONTENT BLOCKS */}
        {hasLiveContent && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-emerald-400" /> Content for this Section
            </h2>
            <div className="space-y-6">
              {blocks.map((block, idx) => (
                <div key={idx}>
                  {renderBlock(block)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study tip */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
          <Lightbulb className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-300 mb-1">Teaching Tip</p>
            <p className="text-xs text-slate-400">
              Add a mix of text explanations, code examples, quiz questions and self-check lists.
              Students see your saved blocks immediately — no page reload needed.
            </p>
          </div>
        </div>

        {/* Inline student preview panel */}
        <StudentPreviewPanel moduleSlug={moduleSlug || undefined} trackId={trackId} tier={tierColor} />
      </div>
    );
  }

  return null;
}

// ─── Subtopic Card (for topic view) with nested item support ─────────────────

function SubtopicCard({ sub, index, tierColor }: { sub: TOCItem; index: number; tierColor: string }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-800/40 transition"
      >
        <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${tierColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
          {index + 1}
        </span>
        <span className="flex-1 font-semibold text-white text-sm inline-flex items-center gap-1"><Check className="w-4 h-4" /> {sub.title}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && sub.items && sub.items.length > 0 && (
        <div className="px-5 pb-4 space-y-1.5">
          {sub.items.map((item, ii) => (
            <div key={ii} className="flex items-start gap-2 text-sm text-slate-300 pl-2">
              <Dot className="w-4 h-4 mt-1.5 text-slate-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
      {expanded && (!sub.items || sub.items.length === 0) && (
        <div className="px-5 pb-4 text-xs text-slate-500">No detailed items listed.</div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainerModuleViewer({ track, lessons, resources, nodeCount, moduleCode, moduleSlug: propsModuleSlug, trackId, initialCustomTocEntries }: Props) {
  const router = useRouter();
  const moduleSlug = (track as any).moduleSlug || propsModuleSlug;
  const [toc, setToc] = useState<TOCItem[]>((track.tableOfContents as TOCItem[]) ?? []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"content" | "resources" | "upload" | "edit-toc" | "quiz-grading" | "quiz-reports">("content");
  // Seed with server-fetched entries so displayToc is correct on first render
  const [customTocEntries, setCustomTocEntries] = useState<any[]>(initialCustomTocEntries ?? []);

  // Fetch custom TOC entries
  useEffect(() => {
    async function fetchCustomToc() {
      try {
        const res = await fetch(`/api/toc/${track.id}`);
        if (res.ok) {
          const { entries } = await res.json();
          // Sort entries by order field
          const sortedEntries = entries.sort((a: any, b: any) => a.order - b.order);
          setCustomTocEntries(sortedEntries);
        }
      } catch (error) {
        console.error('Failed to fetch custom TOC:', error);
      }
    }
    fetchCustomToc();
  }, [track.id]);

  const handleTocUpdate = async () => {
    // Refetch custom TOC entries
    const res = await fetch(`/api/toc/${track.id}`);
    if (res.ok) {
      const { entries } = await res.json();
      // Sort entries by order field
      const sortedEntries = entries.sort((a: any, b: any) => a.order - b.order);
      setCustomTocEntries(sortedEntries);
    }
  };

  // Apply custom TOC edits to the displayed TOC
  const displayToc: TOCItem[] = (() => {
    if (customTocEntries.length === 0) return toc;

    console.log('[DEBUG] Custom entries:', customTocEntries.map(e => ({
      id: e.id.substring(0, 20),
      title: e.title.substring(0, 30),
      order: e.order,
      sourceId: e.sourceId ? e.sourceId.substring(0, 20) : null,
      type: e.type
    })));

    // Map all custom entries by their ID and sourceId for quick lookup
    const customById = new Map<string, any>();
    const customBySourceId = new Map<string, any>();

    customTocEntries.forEach(entry => {
      customById.set(entry.id, entry);
      if (entry.sourceId) {
        customBySourceId.set(entry.sourceId, entry);
      }
    });

    // Process all TOC items and mark them with custom order if they exist
    const processedItems: (TOCItem & { _customOrder?: number; _isCustom?: boolean })[] = toc.map(item => {
      const customEntry = customBySourceId.get(item.id);
      if (customEntry) {
        // This default item has a custom replacement
        return {
          ...item,
          title: customEntry.title,
          hours: customEntry.hours ?? item.hours,
          description: customEntry.description ?? item.description,
          _customOrder: customEntry.order,
          _isCustom: true,
        };
      }
      return item;
    });

    // Add brand new custom entries (those without sourceId)
    customTocEntries.forEach(entry => {
      if (!entry.sourceId) {
        processedItems.push({
          id: entry.id,
          type: entry.type === 'learningOutcome' ? 'outcome' : entry.type as any,
          title: entry.title,
          hours: entry.hours,
          parentId: entry.parentId,
          items: [],
          _customOrder: entry.order,
          _isCustom: true,
        });
      }
    });

    console.log('[DEBUG] Processed items:', processedItems.filter((i: any) => i.type === 'outcome').map((i: any) => ({ title: i.title, order: i._customOrder })));

    // Group by type and parent, then sort within each group
    const grouped = new Map<string, TOCItem[]>();

    processedItems.forEach(item => {
      const key = `${item.type}-${item.parentId || 'root'}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });

    // Sort each group: custom entries by their order, defaults by position
    grouped.forEach((group, key) => {
      group.sort((a, b) => {
        const aCustom = '_customOrder' in a;
        const bCustom = '_customOrder' in b;

        // Both have custom order - sort by order
        if (aCustom && bCustom) {
          return ((a as any)._customOrder || 0) - ((b as any)._customOrder || 0);
        }

        // Only a has custom order - a comes before defaults
        if (aCustom) return -1;

        // Only b has custom order - b comes before defaults  
        if (bCustom) return 1;

        // Neither has custom order - maintain original order
        return 0;
      });
    });

    const outcomes = grouped.get('outcome-root') || [];
    console.log('[DEBUG] Sorted outcomes:', outcomes.map((o: any) => ({ title: o.title, order: o._customOrder, hasCustom: '_customOrder' in o })));

    // Rebuild the flat TOC in hierarchical order
    const finalToc: TOCItem[] = [];

    // Process learning outcomes
    outcomes.forEach(outcome => {
      finalToc.push(outcome);

      // Add topics for this outcome
      const topics = grouped.get(`topic-${outcome.id}`) || [];
      topics.forEach(topic => {
        finalToc.push(topic);

        // Add subtopics for this topic
        const subtopics = grouped.get(`subtopic-${topic.id}`) || [];
        subtopics.forEach(subtopic => {
          finalToc.push(subtopic);

          // Add items for this subtopic
          const items = grouped.get(`item-${subtopic.id}`) || [];
          finalToc.push(...items);
        });

        // Add items directly under topic (no subtopic)
        const topicItems = grouped.get(`item-${topic.id}`) || [];
        finalToc.push(...topicItems);
      });
    });

    return finalToc;
  })();

  // Seed activeItem from displayToc (includes custom entries from server immediately)
  const [activeItem, setActiveItem] = useState<TOCItem | null>(
    () => displayToc.find(t => t.type === "outcome") ?? null
  );

  // Update activeItem when custom TOC changes and the active item has been edited
  useEffect(() => {
    if (activeItem && customTocEntries.length > 0) {
      const updatedItem = displayToc.find(t => t.id === activeItem.id);
      if (updatedItem && updatedItem.title !== activeItem.title) {
        setActiveItem(updatedItem);
      }
    }
  }, [customTocEntries]);

  // Convert default TOC to TocEntry format for editing
  const convertTocToEntries = (tocItems: TOCItem[]): any[] => {
    const entries: any[] = [];

    // Group by outcomes
    const outcomes = tocItems.filter(t => t.type === 'outcome');

    outcomes.forEach((outcome, outIdx) => {
      const outcomeId = `default-outcome-${outIdx}`;
      entries.push({
        id: outcomeId,
        type: 'learningOutcome',
        parentId: null,
        title: outcome.title,
        hours: outcome.hours || null,
        order: outIdx,
        isCustom: false,
        sourceId: outcome.id,
      });

      // Find topics for this outcome (topics have parentId matching outcome.id)
      const topics = tocItems.filter(t => t.type === 'topic' && t.parentId === outcome.id);

      topics.forEach((topic, topicIdx) => {
        const topicId = `default-topic-${outIdx}-${topicIdx}`;
        entries.push({
          id: topicId,
          type: 'topic',
          parentId: outcomeId,
          title: topic.title,
          hours: null,
          order: topicIdx,
          isCustom: false,
          sourceId: topic.id,
        });

        // Find subtopics for this topic (subtopics have parentId matching topic.id)
        const subtopics = tocItems.filter(t =>
          t.type === 'subtopic' && t.parentId === topic.id
        );

        subtopics.forEach((subtopic, subIdx) => {
          const subtopicId = `default-subtopic-${outIdx}-${topicIdx}-${subIdx}`;
          entries.push({
            id: subtopicId,
            type: 'subtopic',
            parentId: topicId,
            title: subtopic.title,
            hours: null,
            order: subIdx,
            isCustom: false,
            sourceId: subtopic.id,
          });

          // Add items if this subtopic has them
          if (subtopic.items && Array.isArray(subtopic.items)) {
            subtopic.items.forEach((itemText, itemIdx) => {
              const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;
              entries.push({
                id: itemId,
                type: 'item',
                parentId: subtopicId,
                title: itemText,
                hours: null,
                order: itemIdx,
                isCustom: false,
                sourceId: `${subtopic.id}-item-${itemIdx}`,
              });
            });
          }
        });
      });
    });

    return entries;
  };

  // Merge default and custom TOC entries, filtering out replaced defaults
  const allTocEntries = (() => {
    const defaultEntries = convertTocToEntries(toc);

    // Build a Set of sourceIds from custom entries (these are default IDs that have been replaced)
    const replacedDefaultIds = new Set(
      customTocEntries
        .filter(entry => entry.sourceId)
        .map(entry => entry.sourceId)
    );

    // Filter out defaults that have been replaced
    const filteredDefaults = defaultEntries.filter(entry => !replacedDefaultIds.has(entry.sourceId));

    return [...filteredDefaults, ...customTocEntries];
  })();
  const [editingItem, setEditingItem] = useState<TOCItem | null>(null);  // item currently being edited
  // liveBlocks: topicId → blocks saved by trainer (updated after each save)
  const [liveBlocks, setLiveBlocks] = useState<Record<string, LearnBlock[]>>({});
  const [dbNodeId, setDbNodeId] = useState<string | null>(null);
  // State: mapping from TOC item ID → DB key used when saving
  const [tocToDbKey, setTocToDbKey] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Fetch live blocks from DB on mount + build TOC→DB key mapping ──────
  useEffect(() => {
    // ALWAYS try to load blocks from SkillNode first (for hierarchical content)
    fetch(`/api/passport/tracks/${track.id}/nodes`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data || !data.nodes) {
          // If no SkillNode data and we have moduleSlug, try module-based loading
          if (moduleSlug) {
            loadFromModule();
          }
          return;
        }

        // Combine all node blocks
        const combined: Record<string, LearnBlock[]> = {};
        data.nodes.forEach((node: any) => {
          if (node.blocks) {
            Object.entries(node.blocks).forEach(([key, blocks]) => {
              combined[key] = blocks as LearnBlock[];
            });
          }
        });

        if (Object.keys(combined).length > 0) {
          setLiveBlocks(combined);
          console.log(`✅ Loaded ${Object.keys(combined).length} curriculum items from SkillNodes`);
        } else if (moduleSlug) {
          // No SkillNode blocks, try module-based loading
          loadFromModule();
        }
      })
      .catch(() => {
        // On error, try module-based loading if available
        if (moduleSlug) loadFromModule();
      });

    function loadFromModule() {
      fetch(`/api/module/${moduleSlug}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return;
          if (data.nodeId) setDbNodeId(data.nodeId);

          // Build combined block map covering all key formats
          const combined: Record<string, LearnBlock[]> = { ...(data.blockMap ?? {}) };
          const keyMapping: Record<string, string> = {};

          if (data.module) {
            const mod: LearnModule = data.module;
            let fi = 0;
            const flatTopics: Array<{ id: string; nodeKey: string; blocks: LearnBlock[]; outcomeTitle: string; topicTitle: string }> = [];

            // Build flat topics with their hierarchical context
            mod.outcomes.forEach((o) =>
              o.indicativeContents.forEach((ic) =>
                ic.topics.forEach((t) => {
                  const nodeKey = data.nodeId ? `${data.nodeId}-t${++fi}` : t.id;
                  flatTopics.push({
                    id: t.id,
                    nodeKey,
                    blocks: t.blocks ?? [],
                    outcomeTitle: o.title,
                    topicTitle: t.title
                  });
                  if (t.blocks && t.blocks.length > 0) {
                    combined[t.id] = t.blocks;
                    combined[nodeKey] = t.blocks;
                  }
                })
              )
            );

            // Map TOC subtopics → nodeId-tN keys by HIERARCHICAL MATCHING (not position!)
            const tocSubs = toc.filter(t => t.type === "subtopic");
            const tocTopics = toc.filter(t => t.type === "topic");
            const tocOutcomes = toc.filter(t => t.type === "outcome");

            // Track which flatTopics have been matched to avoid reusing them
            const usedFlatTopicIndices = new Set<number>();

            tocSubs.forEach((sub) => {
              // Find the parent hierarchy for this subtopic
              const parentTopic = tocTopics.find(t => t.id === sub.parentId);
              const parentOutcome = parentTopic ? tocOutcomes.find(o => o.id === parentTopic.parentId) : null;

              if (!parentTopic || !parentOutcome) return;

              // Skip subtopics that have items - they should be matched via their individual items
              if (sub.items && Array.isArray(sub.items) && sub.items.length > 0) {
                // Match each virtual item individually
                sub.items.forEach((itemText, itemIdx) => {
                  const outIdx = tocOutcomes.findIndex(o => o.id === parentOutcome.id);
                  const topicIdx = tocTopics.findIndex(t => t.id === sub.parentId);
                  const subIdx = tocSubs.findIndex(s => s.id === sub.id);
                  const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;

                  // Find matching flat topic for this specific item
                  const matchingIndex = flatTopics.findIndex((ft, idx) => {
                    if (usedFlatTopicIndices.has(idx)) return false;

                    const outcomeMatch =
                      ft.outcomeTitle === parentOutcome.title ||
                      ft.outcomeTitle.includes(parentOutcome.title) ||
                      parentOutcome.title.includes(ft.outcomeTitle);

                    if (!outcomeMatch) return false;

                    // Exact match with item title
                    const itemLower = itemText.toLowerCase().trim();
                    const ftLower = ft.topicTitle.toLowerCase().trim();

                    return itemLower === ftLower;
                  });

                  if (matchingIndex >= 0) {
                    const matchingFlatTopic = flatTopics[matchingIndex];
                    usedFlatTopicIndices.add(matchingIndex);  // Mark as used

                    keyMapping[itemId] = matchingFlatTopic.nodeKey;
                    const blocks = combined[matchingFlatTopic.nodeKey] ?? combined[matchingFlatTopic.id];
                    if (blocks) combined[itemId] = blocks;
                  }
                });
                return;  // Skip regular subtopic matching for this one
              }

              // Regular subtopic matching (without items)
              const matchingIndex = flatTopics.findIndex((ft, idx) => {
                // Skip if this flatTopic was already matched to another subtopic
                if (usedFlatTopicIndices.has(idx)) return false;

                // Match outcome first
                const outcomeMatch =
                  ft.outcomeTitle === parentOutcome.title ||
                  ft.outcomeTitle.includes(parentOutcome.title) ||
                  parentOutcome.title.includes(ft.outcomeTitle);

                if (!outcomeMatch) return false;

                // Then match subtopic title with flat topic title - BE VERY SPECIFIC
                const subLower = sub.title.toLowerCase().trim();
                const ftLower = ft.topicTitle.toLowerCase().trim();

                // Exact match only!
                return subLower === ftLower;
              });

              if (matchingIndex >= 0) {
                const matchingFlatTopic = flatTopics[matchingIndex];
                usedFlatTopicIndices.add(matchingIndex);  // Mark as used

                keyMapping[sub.id] = matchingFlatTopic.nodeKey;
                const blocks = combined[matchingFlatTopic.nodeKey] ?? combined[matchingFlatTopic.id];
                if (blocks) combined[sub.id] = blocks;
              }
            });
          }

          setTocToDbKey(keyMapping);
          if (Object.keys(combined).length > 0) setLiveBlocks(combined);
        })
        .catch(() => {/* non-fatal */ });
    }
  }, [moduleSlug, track.id]);

  // ── Viewed-items tracking (persisted per track in localStorage) ──
  const STORAGE_KEY = `trainer-viewed-${track.id}`;
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch { return new Set(); }
  });

  function markViewed(id: string) {
    setViewedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set([...prev, id]);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch { /* quota */ }
      return next;
    });
  }

  // Total progress counters
  const allSubtopics = displayToc.filter(t => t.type === "subtopic");
  const allTopics = displayToc.filter(t => t.type === "topic");
  const viewedSubtopics = allSubtopics.filter(s => viewedIds.has(s.id)).length;
  const viewedTopics = allTopics.filter(t => viewedIds.has(t.id)).length;
  const coverageItems = allSubtopics.length || allTopics.length;
  const coveredItems = allSubtopics.length ? viewedSubtopics : viewedTopics;
  const coveragePct = coverageItems > 0 ? Math.round((coveredItems / coverageItems) * 100) : 0;

  const tierColor = TIER_COLOR[track.tier] ?? TIER_COLOR.all;
  const tierbadge = TIER_BADGE[track.tier] ?? TIER_BADGE.all;
  const tierLabel = { l3: "Level 3", l4: "Level 4", l5: "Level 5", all: "All Levels" }[track.tier] ?? track.tier;

  function handleTOCGenerated(newToc: TOCItem[], _source: string) {
    console.log(`[handleTOCGenerated] Received ${newToc.length} TOC items`);
    setToc(newToc);
    const firstOutcome = newToc.find(t => t.type === "outcome");
    setActiveItem(firstOutcome ?? null);
    if (firstOutcome) markViewed(firstOutcome.id);
    setEditingItem(null);
    setTab("content");

    // Don't refresh - the TOC is already set in state, no need to refetch from server
    console.log("[handleTOCGenerated] TOC updated successfully, skipping router.refresh()");
  }

  function handleSelect(item: TOCItem) {
    setActiveItem(item);
    setEditingItem(null);  // close editor when navigating
    markViewed(item.id);
    setTab("content");
    setSidebarOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditTopic(item: TOCItem) {
    setEditingItem(item);
    setTab("content");
    setSidebarOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditorSaved(topicId: string, blocks: LearnBlock[]) {
    setLiveBlocks(prev => {
      const next = { ...prev, [topicId]: blocks };
      // Also index under the editing item's original TOC id so ContentPanel
      // can find it by item.id in addition to the resolved block key
      if (editingItem) next[editingItem.id] = blocks;
      return next;
    });
    setEditingItem(null);
    // Restore activeItem using the original TOC id (not the synthetic block key)
    if (editingItem) {
      // editingItem.id is always the REAL TOC id (we no longer overwrite it with the block key)
      const realItem = displayToc.find(t => t.id === editingItem.id) ?? activeItem ?? editingItem;
      setActiveItem(realItem);
    }
  }

  const outcomeCount = displayToc.filter(t => t.type === "outcome").length;
  const topicCount = displayToc.filter(t => t.type === "topic").length;

  return (
    <div className="flex flex-col bg-slate-950 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

      {/* ── Top Header ── */}
      <header className={`shrink-0 bg-gradient-to-r ${tierColor} px-4 md:px-8 py-3 flex items-center gap-4 shadow-lg`}>
        <Link href="/passport" className="text-white/70 hover:text-white text-sm transition shrink-0">
          ← Back
        </Link>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {track.icon && <span className="text-2xl shrink-0">{track.icon}</span>}
          <div className="min-w-0">
            <h1 className="font-extrabold text-white text-base md:text-lg truncate leading-tight">{track.name}</h1>
            {moduleCode && (
              <p className="text-[11px] text-white/60 font-mono tracking-wider">{moduleCode}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Quiz Navigation Buttons - Always visible */}
          <button
            onClick={() => setTab("quiz-grading")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === "quiz-grading"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
              : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white hover:shadow-md"
              }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Quiz Grading</span>
          </button>

          <button
            onClick={() => setTab("quiz-reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${tab === "quiz-reports"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white hover:shadow-md"
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Quiz Reports</span>
          </button>

          <span className={`hidden sm:block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${tierbadge}`}>
            {tierLabel}
          </span>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="md:hidden text-white/80 hover:text-white bg-white/10 rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            ☰ TOC
          </button>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-950 px-4 md:px-8 flex gap-0 overflow-x-auto">
        {([
          { id: "content", label: <><BookOpen className="w-4 h-4 inline" /> Content</>, mobileOnly: false },
          { id: "upload", label: <><Upload className="w-4 h-4 inline" /> Curriculum</>, mobileOnly: false },
          { id: "edit-toc", label: <><Edit3 className="w-4 h-4 inline" /> Edit TOC</>, mobileOnly: false },
          { id: "resources", label: <><Folder className="w-4 h-4 inline" /> Resources</>, mobileOnly: false },
          { id: "quiz-grading", label: <><CheckSquare className="w-4 h-4 inline" /> <span className="hidden sm:inline">Quiz </span>Grading</>, mobileOnly: true },
          { id: "quiz-reports", label: <><BarChart3 className="w-4 h-4 inline" /> <span className="hidden sm:inline">Quiz </span>Reports</>, mobileOnly: true },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${t.mobileOnly ? 'lg:hidden' : ''
              } ${tab === t.id
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main body ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-10 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── LEFT SIDEBAR — TOC ── */}
        <aside className={`
          absolute md:static inset-y-0 left-0 z-10 w-72 shrink-0 bg-slate-950 border-r border-slate-800/80
          flex flex-col overflow-hidden transition-transform duration-300
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          md:translate-x-0
        `}>
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Table of Contents</h2>
              {toc.length > 0 && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {outcomeCount} LO · {topicCount} topics
                </span>
              )}
            </div>
            {track.description && (
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{track.description}</p>
            )}
            {/* Coverage bar */}
            {coverageItems > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Module coverage</span>
                  <span className={coveragePct >= 100 ? "text-emerald-400 font-bold" : "text-slate-400"}>
                    {coveredItems}/{coverageItems} · {coveragePct}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${coveragePct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-sky-500"}`}
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* TOC list */}
          <div className="flex-1 overflow-y-auto">
            {tab === "content" ? (
              <TOCSidebar
                toc={displayToc}
                activeId={activeItem?.id ?? null}
                viewedIds={viewedIds}
                onSelect={handleSelect}
                tierColor={tierColor}
              />
            ) : (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                Switch to Content tab to browse the TOC.
              </div>
            )}
          </div>

          {/* Upload shortcut */}
          <div className="shrink-0 p-3 border-t border-slate-800">
            <button
              onClick={() => setTab("upload")}
              className="w-full rounded-xl border border-dashed border-violet-500/30 text-violet-400 hover:bg-violet-500/5 text-xs py-2 transition font-medium"
            >
              {toc.length === 0 ? <><Sparkles className="w-4 h-4 inline" /> Generate TOC</> : <><Cog className="w-4 h-4 inline" /> Regenerate TOC</>}
            </button>
          </div>
        </aside>

        {/* ── RIGHT CONTENT AREA ── */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">

          {/* CONTENT tab — show editor OR viewer */}
          {tab === "content" && (
            editingItem ? (() => {
              // Resolve the DB key for this item.
              // Priority:
              //  1. _resolvedKey attached by ContentPanel (outcome, topic, subtopic, item all set this)
              //  2. id already looks like a default-* key → use as-is
              //  3. tocToDbKey mapping (legacy subtopic path)
              //  4. dbNodeId-tN fallback

              const resolvedKey: string =
                (editingItem as any)._resolvedKey
                ?? (editingItem.id.startsWith('default-') ? editingItem.id : null)
                ?? tocToDbKey[editingItem.id]
                ?? (liveBlocks[editingItem.id] ? editingItem.id : null)
                ?? (() => {
                  const tocSubs = toc.filter(t => t.type === "subtopic");
                  const idx = tocSubs.findIndex(t => t.id === editingItem.id);
                  return dbNodeId ? `${dbNodeId}-t${idx >= 0 ? idx + 1 : 1}` : editingItem.id;
                })();

              // Load existing blocks under the resolved key (or item id alias)
              const existingBlocks =
                liveBlocks[resolvedKey]
                ?? liveBlocks[editingItem.id]
                ?? [];

              return (
                <TrainerContentEditor
                  key={editingItem.id}  // Force re-mount when item changes
                  moduleSlug={moduleSlug}
                  topicId={resolvedKey}
                  topicTitle={editingItem.title}
                  initialBlocks={existingBlocks}
                  tierColor={tierColor}
                  trackId={track.id}
                  onClose={() => setEditingItem(null)}
                  onSaved={(blocks) => {
                    // Store under both the resolved key AND the item's original id
                    // so ContentPanel can find it by either key
                    setLiveBlocks(prev => ({
                      ...prev,
                      [resolvedKey]: blocks,
                      [editingItem.id]: blocks,
                    }));
                    handleEditorSaved(resolvedKey, blocks);
                  }}
                />
              );
            })() : (
              <ContentPanel
                item={activeItem}
                toc={displayToc}
                tierColor={tierColor}
                tierbadge={tierbadge}
                liveBlocks={liveBlocks}
                moduleSlug={moduleSlug ?? null}
                dbNodeId={dbNodeId}
                trackId={track.id}
                onEditTopic={handleEditTopic}
              />
            )
          )}

          {/* UPLOAD / CURRICULUM tab */}
          {tab === "upload" && (
            <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-xl font-bold text-white">Curriculum Management</h2>
              <CurriculumUploadPanel
                trackId={track.id}
                curriculumUrl={track.curriculumUrl}
                onGenerated={handleTOCGenerated}
              />
              {toc.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-3">
                  <h3 className="font-semibold text-white text-sm">Current TOC ({toc.length} items)</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {toc.filter(t => t.type === "outcome").map((o, i) => (
                      <div key={o.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 text-xs text-slate-300">
                        <span>{OUTCOME_ICON_ELS[i % OUTCOME_ICON_ELS.length]}</span>
                        <span className="font-medium">{o.title}</span>
                        {o.hours && <span className="ml-auto text-slate-500 font-mono">{o.hours}h</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
                <span className="text-xl shrink-0">🤖</span>
                <div>
                  <p className="text-xs font-bold text-emerald-300 mb-1">AI TOC Generation</p>
                  <p className="text-xs text-slate-400">
                    Add your <code className="text-emerald-400">GROQ_API_KEY</code> to <code className="text-slate-300">.env</code> to enable
                    AI-powered TOC generation from uploaded curriculum PDFs. Get a free key at{" "}
                    <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">console.groq.com</a>.
                    Without the key, the system uses built-in curriculum content automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* EDIT TOC tab */}
          {tab === "edit-toc" && (
            <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Edit Table of Contents</h2>
                <p className="text-sm text-slate-400">
                  View and customize the complete Table of Contents structure.
                  <span className="text-slate-300 font-medium"> Default curriculum entries</span> are shown in gray (read-only).
                  <span className="text-emerald-400 font-medium"> Custom entries</span> appear with a green badge and can be fully edited.
                  Click ➕ next to any entry to add custom sub-entries.
                </p>
              </div>
              <SimpleTocEditor
                trackId={track.id}
                entries={allTocEntries}
                onUpdate={handleTocUpdate}
              />
            </div>
          )}

          {/* LESSONS tab */}
          {/* RESOURCES tab */}
          {tab === "resources" && (
            <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Resources <span className="text-slate-500 text-base">({resources.length})</span></h2>
                <Link href="/resources" className="text-xs px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition">
                  + Upload Resource
                </Link>
              </div>
              {resources.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-medium">No resources yet</p>
                  <p className="text-sm mt-1">Upload PDFs, videos, links and more from the Resources page.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {resources.map((resource) => (
                    <div key={resource.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4 flex items-start gap-3 hover:border-slate-600 transition">
                      {resource.fileUrl ? <FileText className="w-6 h-6 shrink-0" /> : <BookMarked className="w-6 h-6 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{resource.title}</p>
                        {(resource.fileUrl || resource.url) && (
                          <a href={resource.fileUrl ?? resource.url ?? "#"} target="_blank" rel="noreferrer"
                            className="text-xs text-sky-400 hover:underline mt-1 inline-block">
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QUIZ GRADING tab */}
          {tab === "quiz-grading" && (
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
              <EnhancedQuizGradingDashboard trackId={trackId} />
            </div>
          )}

          {/* QUIZ REPORTS tab */}
          {tab === "quiz-reports" && (
            <div className="p-6 md:p-10 max-w-7xl mx-auto">
              <QuizReportDashboard trackId={trackId} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
