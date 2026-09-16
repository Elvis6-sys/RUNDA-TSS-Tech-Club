'use client';

/**
 * StudentModuleViewer
 *
 * Mirrors TrainerModuleViewer EXACTLY for TOC sidebar and block loading.
 * Same 4-level hierarchy: outcome (blue) → topic (green) → subtopic (orange) → item (yellow)
 * Same block loading: /api/passport/tracks/[trackId]/nodes → merged liveBlocks map
 * Same content panel rendering (student-facing, no edit buttons)
 * Live sync: polls /api/toc/student/[trackId] every 30s, router.refresh() on changes
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Target, Zap, FlaskConical, Wrench, Rocket, Lightbulb,
  ChevronRight, ChevronDown, Check, X,
  BookOpen, ListChecks, Code2, ClipboardList,
  Pin, Dot, FileText, Sparkles, RefreshCw,
  CheckSquare, Star, CheckCircle2, AlertCircle,
} from 'lucide-react';
import type { TOCItem } from '@/app/api/passport/tracks/[trackId]/toc-generate/route';

const InlinePDFViewer = dynamic(() => import('@/components/InlinePDFViewer'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomTocEntry = {
  id: string;
  type: string;
  parentId: string | null;
  title: string;
  hours: number | null;
  order: number;
  isCustom: boolean;
  sourceId: string | null;
};

type SkillNode = {
  id: string;
  title: string;
  description: string | null;
  blocks: Record<string, any[]> | null;
  xpReward: number;
  order: number;
  estimatedMinutes: number;
};

type Props = {
  track: {
    id: string;
    name: string;
    description: string | null;
    tableOfContents: TOCItem[] | null;
    nodes: SkillNode[];
  };
  customTocEntries: CustomTocEntry[];
  user: { id: string; name: string; xp: number };
  progress: Record<string, { status: string; readPct: number }>;
};

// ─── Tier / level colour constants (same as TrainerModuleViewer) ──────────────

const LO_COLORS = {
  text: 'text-blue-300', textActive: 'text-blue-50',
  bg: 'bg-blue-500/10', bgHover: 'hover:bg-blue-500/20', bgActive: 'bg-blue-500/30',
  border: 'border-blue-500/30', borderActive: 'border-blue-400/70',
  icon: 'text-blue-400',
};
const TOPIC_COLORS = {
  text: 'text-green-300', textHover: 'hover:text-green-200', textActive: 'text-green-50',
  bg: 'bg-green-500/10', bgHover: 'hover:bg-green-500/20', bgActive: 'bg-green-500/30',
  border: 'border-green-500/30', borderActive: 'border-green-400/70',
  icon: 'text-green-400', dot: 'bg-green-400',
};
const SUBTOPIC_COLORS = {
  text: 'text-orange-300', textHover: 'hover:text-orange-200', textActive: 'text-orange-50',
  bg: 'bg-orange-500/10', bgHover: 'hover:bg-orange-500/20', bgActive: 'bg-orange-500/30',
  border: 'border-orange-500/30', borderActive: 'border-orange-400/70',
  icon: 'text-orange-400',
};
const ITEM_COLORS = {
  text: 'text-yellow-300', textHover: 'hover:text-yellow-200', textActive: 'text-yellow-50',
  bg: 'bg-yellow-500/10', bgHover: 'hover:bg-yellow-500/20', bgActive: 'bg-yellow-500/30',
  border: 'border-yellow-500/30', borderActive: 'border-yellow-400/70',
};

function OutcomeIcon({ index }: { index: number }) {
  const icons = [Target, Zap, FlaskConical, Wrench, Rocket, Lightbulb];
  const Icon = icons[index % icons.length];
  return <Icon className="w-4 h-4" />;
}

// ─── Block renderer (same as TrainerModuleViewer's renderBlock) ───────────────

// ─── Inline Document Viewer ──────────────────────────────────────────────────

function InlineDocumentViewer({ url, title, description }: { url: string; title: string; description?: string }) {
  const [open, setOpen] = useState(false);

  // Transform URLs for Electron production: /uploads/projects/file.pdf → /api/uploads/projects/file.pdf
  let transformedUrl = url;
  if (url.startsWith('/uploads/projects/')) {
    transformedUrl = url.replace('/uploads/projects/', '/api/uploads/projects/');
  }

  // Detect file normalizedType from URL
  const lower = transformedUrl.toLowerCase().split('?')[0];
  const isPdf = lower.endsWith('.pdf');
  const isDocx = lower.endsWith('.docx') || lower.endsWith('.doc');
  const isXlsx = lower.endsWith('.xlsx') || lower.endsWith('.xls');
  const isPptx = lower.endsWith('.pptx') || lower.endsWith('.ppt');
  const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.avi') || lower.endsWith('.mov') || lower.endsWith('.mkv');
  const isOffice = isDocx || isXlsx || isPptx;

  // Embed src:
  // - PDF from /api/uploads → Serve directly
  // - Other PDFs → Use PDF API endpoint
  // - Office → Google Docs viewer (free, no sign-in needed)
  const embedSrc = isPdf
    ? (transformedUrl.startsWith('/api/uploads/')
      ? transformedUrl  // Already an API route, use directly
      : `/api/resources/pdf?path=${encodeURIComponent(transformedUrl)}`)
    : `https://docs.google.com/viewer?url=${encodeURIComponent(transformedUrl)}&embedded=true`;

  // Icon + label
  const icon = isPdf ? '📄' : isDocx ? '📝' : isXlsx ? '📊' : isPptx ? '📑' : isVideo ? '🎥' : '📎';
  const normalizedTypeLabel = isPdf ? 'PDF' : isDocx ? 'Word Document' : isXlsx ? 'Spreadsheet' : isPptx ? 'Presentation' : isVideo ? 'Video' : 'Document';

  return (
    <div className="my-4 rounded-2xl border border-slate-700/70 bg-slate-800/60 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate">{title}</h4>
          <p className="text-slate-400 text-xs">{normalizedTypeLabel}{description ? ` — ${description}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Toggle inline viewer */}
          <button
            onClick={() => setOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${open
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            {open ? 'Close' : 'Read Inline'}
          </button>
          {/* Always keep external link as fallback */}
          <a
            href={transformedUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition"
            title="Open in new tab"
          >
            ↗
          </a>
        </div>
      </div>

      {/* Inline viewer — only rendered when open */}
      {open && (
        <div className="relative w-full bg-slate-900" style={{ height: '70vh' }}>
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
            <iframe
              src={embedSrc}
              className="w-full h-full border-0"
              title={title}
              allow="fullscreen"
              loading="lazy"
            />
          ) : (
            /* Generic fallback: try iframe with the raw URL */
            <iframe
              src={transformedUrl}
              className="w-full h-full border-0"
              title={title}
              loading="lazy"
            />
          )}
          {/* Resize handle hint */}
          {!isPdf && !isVideo && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center py-1 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none">
              <span className="text-[10px] text-slate-500">Scroll inside to read • Click ↗ to open full screen</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function renderBlock(block: any): React.ReactNode {
  switch (block.type) {
    case 'text': {
      const content: string = block.content || '';
      // Detect HTML output from WYSIWYG editor vs legacy markdown
      const isHtml = /<[a-zA-Z][\s\S]*>/i.test(content);
      if (isHtml) {
        return (
          <div
            className="
              prose prose-sm max-w-none
              [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-white
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-white [&_h2]:border-b [&_h2]:border-slate-600 [&_h2]:pb-1
              [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-white
              [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:text-slate-200
              [&_p]:my-2 [&_p]:text-slate-300 [&_p]:leading-relaxed
              [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:list-disc
              [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal
              [&_li]:my-0.5 [&_li]:text-slate-300
              [&_strong]:text-white [&_strong]:font-bold
              [&_em]:italic [&_em]:text-slate-300
              [&_u]:underline
              [&_s]:line-through [&_s]:text-slate-500
              [&_blockquote]:border-l-4 [&_blockquote]:border-sky-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400 [&_blockquote]:my-3
              [&_pre]:bg-slate-950 [&_pre]:text-emerald-300 [&_pre]:rounded-xl [&_pre]:px-4 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-3 [&_pre]:overflow-x-auto
              [&_code]:bg-slate-800 [&_code]:text-sky-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
              [&_a]:text-sky-400 [&_a]:underline [&_a]:hover:text-sky-300
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
              [&_th]:bg-slate-800 [&_th]:font-bold [&_th]:text-left [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-slate-600 [&_th]:text-white [&_th]:text-sm
              [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-slate-600 [&_td]:text-slate-300 [&_td]:text-sm
              [&_tr:hover]:bg-slate-800/40
              [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3
              [&_hr]:border-slate-600 [&_hr]:my-4
            "
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      }
      // Legacy markdown fallback
      let html = content;
      html = html.replace(/```mermaid\n([\s\S]*?)\n```/g,
        '<div class="bg-gradient-to-br from-emerald-950 to-slate-900 rounded-xl p-6 my-4 border-2 border-emerald-500/30"><span class="text-emerald-400 text-xs font-bold block mb-2">📊 DIAGRAM</span><pre class="overflow-x-auto text-emerald-300 font-mono text-xs whitespace-pre leading-relaxed">$1</pre></div>');
      html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g,
        '<div class="bg-slate-950 rounded-xl p-4 my-4 border border-slate-700"><pre class="overflow-x-auto"><code class="text-sm text-slate-300 font-mono">$2</code></pre></div>');
      html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-extrabold text-white mt-8 mb-3">$1</h2>');
      html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-emerald-400 mt-5 mb-2">$1</h3>');
      html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-slate-200 mt-3 mb-1">$1</h4>');
      html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-extrabold text-violet-300 mt-2 mb-3">$1</h1>');
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      html = html.replace(/\*(.+?)\*/g, '<em class="text-slate-300 italic">$1</em>');
      html = html.replace(/`(.+?)`/g, '<code class="bg-slate-700 px-1 rounded text-emerald-300 text-sm font-mono">$1</code>');
      html = html.replace(/^\* (.+)$/gm, '<li class="ml-6 text-slate-300 list-disc mb-1">$1</li>');
      html = html.replace(/^- (.+)$/gm, '<li class="ml-6 text-slate-300 list-disc mb-1">$1</li>');
      html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m: string) => `<ul class="my-3 space-y-1">${m}</ul>`);
      html = html.split('\n\n').map((p: string) =>
        p.startsWith('<') || p.trim() === '' ? p : `<p class="text-slate-300 leading-relaxed mb-3">${p}</p>`
      ).join('\n');
      return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    case 'video': {
      let url = block.url || '';
      if (url.includes('youtube.com/watch?v=')) url = `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}`;
      else if (url.includes('youtu.be/')) url = `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}`;
      else if (url.includes('vimeo.com/')) {
        const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0]?.split('/')[0];
        if (vimeoId) url = `https://player.vimeo.com/video/${vimeoId}`;
      }
      if (!url) return null;
      // Direct MP4 / non-embeddable — use <video> tag
      const isDirect = !url.includes('youtube') && !url.includes('youtu.be') && !url.includes('vimeo');
      return (
        <div className="my-4 rounded-xl overflow-hidden border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/5 to-purple-500/5 shadow-xl">
          <div className="bg-gradient-to-r from-rose-600 to-purple-600 px-4 py-3 flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <div>
              <h4 className="font-bold text-white">{block.title || 'Video'}</h4>
              {block.description && <p className="text-white/70 text-xs">{block.description}</p>}
            </div>
          </div>
          {isDirect ? (
            <video src={url} controls className="w-full" style={{ maxHeight: '400px' }} />
          ) : (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe src={url} className="absolute top-0 left-0 w-full h-full" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}
        </div>
      );
    }
    case 'image': {
      let imgUrl = (block as any).url || '';
      const imgAlt = (block as any).alt || 'Image';
      const imgCaption = (block as any).caption || '';
      if (!imgUrl) return null;

      // Transform URLs for Electron production: /uploads/projects/file.jpg → /api/uploads/projects/file.jpg
      if (imgUrl.startsWith('/uploads/projects/')) {
        imgUrl = imgUrl.replace('/uploads/projects/', '/api/uploads/projects/');
      }

      return (
        <div className="my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-900/50 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            alt={imgAlt}
            className="w-full h-auto object-contain max-h-[600px]"
            onError={(e) => {
              console.error('[Image] Failed to load:', imgUrl);
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23334155" width="400" height="200"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E📷 Image unavailable%3C/text%3E%3C/svg%3E';
            }}
          />
          {imgCaption && (
            <div className="px-4 py-2 bg-slate-800/80 border-t border-slate-700">
              <p className="text-slate-400 text-xs italic">💡 {imgCaption}</p>
            </div>
          )}
        </div>
      );
    }
    case 'code': {
      const lang = block.language || 'code';
      const codeText = block.code || block.content || '';
      return (
        <div className="my-4 rounded-xl overflow-hidden border border-slate-700">
          <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase">{lang}</span>
            <Code2 className="w-4 h-4 text-slate-500" />
          </div>
          <pre className="bg-slate-950 p-4 overflow-x-auto">
            <code className="text-sm text-emerald-400 font-mono">{codeText}</code>
          </pre>
        </div>
      );
    }
    case 'quiz':
      // ALL quizzes use secure fullscreen anti-cheat mode (no exceptions)
      return <SecureQuizLauncher block={block} />;
    case 'checklist':
      return <StudentChecklist block={block} />;
    case 'assignment':
      // ALL assignments use secure fullscreen anti-cheat mode (no exceptions)
      return <SecureAssignmentLauncher block={block} />;
    case 'document': {
      const docUrl = (block as any).url || '';
      const docTitle = (block as any).title || 'Module Document';
      const docDesc = (block as any).description || '';
      if (!docUrl) return null;
      return <InlineDocumentViewer url={docUrl} title={docTitle} description={docDesc} />;
    }
    default:
      return null;
  }
}

// ─── Secure quiz launcher ────────────────────────────────────────────────────

/**
 * SecureQuizLauncher — Launches a fullscreen anti-cheat quiz session.
 * Shows a prominent "Start Quiz" button that triggers the anti-cheat system.
 * Once started, all shortcuts (F keys, Alt+F4, Esc, Ctrl+C, etc.) are blocked.
 * Exiting fullscreen = instant auto-submit in web browser.
 * In Electron, the OS-level lockdown prevents ANY escape.
 */
function SecureQuizLauncher({ block }: { block: any }) {
  const [started, setStarted] = useState(false);
  const [attemptState, setAttemptState] = useState<
    'checking' | 'available' | 'already_submitted'
  >('checking');
  const [prevSubmission, setPrevSubmission] = useState<any>(null);

  const questions: any[] = block.questions || [];
  const quizTitle = block.title || "Assessment Quiz";
  const quizDesc = block.description || "Complete this quiz under exam conditions. All shortcuts are disabled.";

  // ── Check if student already attempted this quiz ─────────────────────────
  // Runs on mount AND whenever `started` goes back to false (quiz completed),
  // so the locked state appears immediately after the student submits.
  useEffect(() => {
    // Don't check while actively in the quiz
    if (started) return;

    const nodeId = block._nodeId;
    const blockId = block.id || block._blockKey;
    if (!nodeId || !blockId) {
      setAttemptState('available');
      return;
    }

    setAttemptState('checking');

    fetch(`/api/quiz/check-attempt?nodeId=${encodeURIComponent(nodeId)}&blockId=${encodeURIComponent(blockId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.attempted) {
          setPrevSubmission(data.submission);
          setAttemptState('already_submitted');
        } else {
          setAttemptState('available');
        }
      })
      .catch(() => {
        // On error, allow start — better UX than blocking forever
        setAttemptState('available');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, block._nodeId, block.id, block._blockKey]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (attemptState === 'checking') {
    return (
      <div className="my-4 rounded-2xl border-2 border-slate-700/60 bg-slate-900/40 p-6 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
        <span className="text-slate-400 text-sm">Checking quiz status…</span>
      </div>
    );
  }

  // ── Already submitted — show locked state ─────────────────────────────────
  if (attemptState === 'already_submitted') {
    const score = prevSubmission?.avgScore;
    const status = prevSubmission?.status ?? 'submitted';
    const submittedAt = prevSubmission?.createdAt
      ? new Date(prevSubmission.createdAt).toLocaleString()
      : 'previously';

    return (
      <div className="my-4 rounded-2xl border-2 border-slate-600/60 bg-slate-900/60 p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-700/60 flex items-center justify-center shrink-0 border-2 border-slate-600/40">
            <span className="text-3xl">🔐</span>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-extrabold text-white text-xl leading-tight">{quizTitle}</h4>
              <p className="text-slate-400 text-sm mt-1">You have already attempted this quiz.</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Submitted:</span>
                <span className="text-white font-medium">{submittedAt}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Status:</span>
                <span className={`font-semibold ${status === 'graded' ? 'text-emerald-400' :
                  status === 'grading' ? 'text-amber-400' :
                    'text-slate-300'
                  }`}>
                  {status === 'graded' ? '✅ Graded' :
                    status === 'grading' ? '⏳ Grading in progress' :
                      '📬 Submitted — awaiting grading'}
                </span>
              </div>
              {score !== null && score !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Score:</span>
                  <span className={`font-bold text-base ${score >= 75 ? 'text-emerald-400' :
                    score >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>{score}%</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>Each quiz may only be attempted once. Contact your trainer if you believe this is an error.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Available — show normal launcher ─────────────────────────────────────
  if (!started) {
    return (
      <div className="my-4 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-red-500/10 p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border-2 border-amber-500/30">
            <span className="text-3xl">🔒</span>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-extrabold text-white text-xl flex items-center gap-2 leading-tight">
                {quizTitle}
              </h4>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{quizDesc}</p>
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🔒 Secure fullscreen mode
              </span>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                ⚠️ One attempt only
              </span>
            </div>

            {/* Warning box */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 space-y-2">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Exam Rules — Read Carefully
              </p>
              <ul className="text-slate-300 text-xs space-y-1.5 leading-relaxed pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>You have <strong className="text-white">one attempt only</strong>. Once submitted you cannot retake this quiz.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>All keyboard shortcuts (F5, Esc, F12, Alt+F4, Ctrl+C, etc.) are <strong className="text-white">blocked</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Leaving fullscreen or switching tabs will <strong className="text-white">auto-submit</strong> your quiz immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Your trainer will be notified when you submit.</span>
                </li>
              </ul>
            </div>

            {/* Start button */}
            <button
              onClick={() => setStarted(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white text-base
                bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 hover:from-amber-500 hover:via-rose-500 hover:to-red-500
                shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-xl">🚀</span>
              <span>Start Secure Quiz</span>
            </button>

            <p className="text-center text-[10px] text-slate-500 leading-relaxed">
              By clicking "Start", you agree to the exam rules. This is your one and only attempt.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz started — render the secure fullscreen quiz
  return <SecureQuizSession block={block} onExit={() => setStarted(false)} />;
}

// ─── Question input component (all 13 normalizedTypes) ─────────────────────────────────

/**
 * QuestionInput — Renders the appropriate input UI for each question type.
 * Supports all 13 types: mcq, truefalse, fillin, multiselect, matching, ordering,
 * shortanswer, essay, code, fileupload, drawing, audio, video
 */
function QuestionInput({
  question,
  answer,
  done,
  onSubmit,
  fillVal,
  setFillVal,
  setAnswers,
  idx,
}: {
  question: any;
  answer: any;
  done: boolean;
  onSubmit: (val: any) => void;
  fillVal: string;
  setFillVal: (val: string) => void;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  idx: number;
}) {
  const q = question;
  const rawType = q.questionType || q.type; // Support both field names

  // Normalize type aliases
  const type = rawType === 'short' ? 'shortanswer'
    : rawType === 'coding' ? 'code'
      : rawType === 'file_upload' ? 'fileupload'
        : rawType === 'drawing_upload' ? 'drawing'
          : rawType === 'audio_response' ? 'audio'
            : rawType === 'video_response' ? 'video'
              : rawType;

  // ── ALL HOOKS AT THE TOP (React rules) ────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);  // for audio type
  const videoFileRef = useRef<HTMLInputElement>(null);  // for video type
  const [file, setFile] = useState<File | null>(answer?.file ?? null);
  const [image, setImage] = useState<File | null>(answer?.file ?? null);
  const [preview, setPreview] = useState<string | null>(answer?.preview ?? null);

  // DEBUG: Log ALL question data to console (will appear in Electron terminal)
  console.log(`[QUESTION ${idx + 1}] Type: ${type}`);
  console.log(`[QUESTION ${idx + 1}] Full data:`, JSON.stringify(q, null, 2));

  // ── 1. Multiple Choice (single correct) ────────────────────────────────────
  if (type === 'mcq') {
    return (
      <div className="space-y-2">
        {(q.options || []).map((opt: string, oi: number) => {
          const chosen = answer === oi;
          const isRight = oi === q.correct;
          return (
            <button key={oi} disabled={done} onClick={() => onSubmit(oi)}
              className={`w-full text-left px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all
                ${done && isRight ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : ''}
                ${done && chosen && !isRight ? 'border-red-500 bg-red-500/15 text-red-200' : ''}
                ${!done && chosen ? 'border-violet-500 bg-violet-500/15 text-violet-200' : ''}
                ${!done && !chosen ? 'border-slate-700 hover:border-violet-500 hover:bg-violet-500/10 text-slate-300' : ''}
                ${done && !chosen && !isRight ? 'border-slate-800 text-slate-600' : ''}`}>
              <span className="font-mono text-violet-400 mr-3">{String.fromCharCode(65 + oi)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // ── 2. True / False ─────────────────────────────────────────────────────────
  if (type === 'truefalse') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {['True', 'False'].map((label, oi) => {
          const chosen = answer === oi;
          const isRight = oi === q.correct;
          return (
            <button key={oi} disabled={done} onClick={() => onSubmit(oi)}
              className={`px-6 py-4 rounded-xl border-2 text-base font-bold transition-all flex items-center justify-center gap-2
                ${done && isRight ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : ''}
                ${done && chosen && !isRight ? 'border-red-500 bg-red-500/15 text-red-200' : ''}
                ${!done && chosen ? 'border-violet-500 bg-violet-500/15 text-violet-200' : ''}
                ${!done && !chosen ? 'border-slate-700 hover:border-violet-500 hover:bg-violet-500/10 text-slate-300' : ''}
                ${done && !chosen && !isRight ? 'border-slate-800 text-slate-600' : ''}`}>
              {oi === 0 ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // ── 3. Fill in the Blank ────────────────────────────────────────────────────
  if (type === 'fillin') {
    return (
      <div className="space-y-3">
        <input
          type="text"
          disabled={done}
          value={done ? (answer || '') : fillVal}
          onChange={e => setFillVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !done && fillVal.trim() && onSubmit(fillVal.trim())}
          placeholder="Type your answer here…"
          className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-base focus:outline-none focus:border-violet-500 transition placeholder:text-slate-500"
        />
        {!done && fillVal.trim() && (
          <button onClick={() => onSubmit(fillVal.trim())}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
            Submit Answer
          </button>
        )}
      </div>
    );
  }

  // ── 4. Multi-select (select all that apply) ────────────────────────────────
  if (type === 'multiselect') {
    const sel: number[] = answer ?? [];
    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-400 font-medium">✓ Select all correct answers</p>
        {(q.options || []).map((opt: string, oi: number) => {
          const chosen = sel.includes(oi);
          const correctArr: number[] = Array.isArray(q.correct) ? q.correct : [];
          const isRight = correctArr.includes(oi);
          return (
            <button key={oi} disabled={done}
              onClick={() => setAnswers(a => ({ ...a, [idx]: chosen ? sel.filter(x => x !== oi) : [...sel, oi] }))}
              className={`w-full text-left flex items-start gap-3 px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all
                ${done && isRight ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : ''}
                ${done && chosen && !isRight ? 'border-red-500 bg-red-500/15 text-red-200' : ''}
                ${!done && chosen ? 'border-violet-500 bg-violet-500/15 text-violet-200' : ''}
                ${!done && !chosen ? 'border-slate-700 hover:border-violet-500 text-slate-300' : ''}`}>
              <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                ${chosen ? 'bg-violet-500 border-violet-500' : 'border-slate-600'}`}>
                {chosen && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{opt}</span>
            </button>
          );
        })}
        {!done && sel.length > 0 && (
          <button onClick={() => onSubmit(sel)}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
            Submit ({sel.length} selected)
          </button>
        )}
      </div>
    );
  }

  // ── 5. Matching (match pairs) ───────────────────────────────────────────────
  if (type === 'matching') {
    // Log the full question object to understand the structure
    console.log('[MATCHING] Full question object:', JSON.stringify(q, null, 2));

    // Support both data formats:
    // Format 1: pairs array [{ left: "A", right: "1" }]
    // Format 2: leftColumn + rightColumn arrays (from database)
    let leftItems: any[] = [];
    let rightItems: any[] = [];

    if (q.pairs && Array.isArray(q.pairs)) {
      // Format 1: pairs array
      leftItems = q.pairs.map((p: any, i: number) => ({ id: i, text: p.left }));
      rightItems = q.pairs.map((p: any, i: number) => ({ id: i, text: p.right }));
      console.log('[MATCHING] Using pairs format');
    } else if (q.leftColumn && q.rightColumn) {
      // Format 2: leftColumn + rightColumn (database format)
      leftItems = q.leftColumn.map((text: string, i: number) => ({ id: i, text: text.trim() }));
      rightItems = q.rightColumn.map((text: string, i: number) => ({ id: i, text: text.trim() }));
      console.log('[MATCHING] Using leftColumn/rightColumn format');
    }

    const matches: Record<number, number> = answer ?? {};

    // Debug logging
    console.log('[MATCHING] leftItems:', leftItems);
    console.log('[MATCHING] rightItems:', rightItems);

    if (leftItems.length === 0) {
      console.warn('⚠️ [MATCHING] No matching data found');
      return (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-8 border-2 border-dashed border-red-500/50 rounded-xl bg-red-500/10">
            <p className="text-red-400 font-medium">⚠️ No matching pairs configured</p>
            <p className="text-xs text-slate-400">This question needs leftColumn and rightColumn data.</p>
          </div>
        </div>
      );
    }

    console.log('[MATCHING] Rendering', leftItems.length, 'matching pairs');

    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-400 font-medium mb-3">🔗 Match each item on the left with the correct item on the right</p>

        {leftItems.map((leftItem: any) => (
          <div key={leftItem.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
            {/* Left item */}
            <div className="flex items-center gap-2 flex-1">
              <span className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold flex items-center justify-center shrink-0">
                {String.fromCharCode(65 + leftItem.id)}
              </span>
              <span className="text-white text-sm">{leftItem.text}</span>
            </div>

            {/* Arrow */}
            <span className="text-slate-500 shrink-0">→</span>

            {/* Dropdown for right items */}
            <select
              disabled={done}
              value={matches[leftItem.id] ?? ''}
              onChange={(e) => {
                const rightId = parseInt(e.target.value);
                console.log(`[MATCHING] Selected: ${leftItem.text} → ${rightItems[rightId]?.text}`);
                if (!isNaN(rightId)) {
                  setAnswers(a => ({ ...a, [idx]: { ...matches, [leftItem.id]: rightId } }));
                }
              }}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 text-white rounded-lg text-sm focus:border-violet-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select match...</option>
              {rightItems.map((rightItem: any) => (
                <option key={rightItem.id} value={rightItem.id}>
                  {rightItem.id + 1}. {rightItem.text}
                </option>
              ))}
            </select>

            {/* Feedback icon */}
            {done && matches[leftItem.id] !== undefined && (
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${matches[leftItem.id] === leftItem.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                {matches[leftItem.id] === leftItem.id ? '✓' : '✗'}
              </span>
            )}
          </div>
        ))}

        {!done && Object.keys(matches).length === leftItems.length && (
          <button onClick={() => onSubmit(matches)}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg mt-4">
            Submit Matches
          </button>
        )}
      </div>
    );
  }

  // ── 6. Ordering (arrange in sequence) ──────────────────────────────────────
  if (type === 'ordering') {
    const items = q.items || []; // ["Step 1", "Step 2", ...]
    const order: number[] = answer ?? items.map((_: any, i: number) => i);

    const moveUp = (i: number) => {
      if (i === 0) return;
      const newOrder = [...order];
      [newOrder[i], newOrder[i - 1]] = [newOrder[i - 1], newOrder[i]];
      setAnswers(a => ({ ...a, [idx]: newOrder }));
    };

    const moveDown = (i: number) => {
      if (i === order.length - 1) return;
      const newOrder = [...order];
      [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
      setAnswers(a => ({ ...a, [idx]: newOrder }));
    };

    return (
      <div className="space-y-3">
        <p className="text-xs text-slate-400 font-medium">⬆️⬇️ Arrange the following items in the correct order</p>
        <div className="space-y-2">
          {order.map((itemIdx, i) => {
            const correctIdx = done ? q.correct?.[i] : null;
            const isCorrect = done && itemIdx === correctIdx;
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition
                ${done && isCorrect ? 'border-emerald-500 bg-emerald-500/15' : ''}
                ${done && !isCorrect ? 'border-red-500 bg-red-500/15' : ''}
                ${!done ? 'border-slate-700 bg-slate-800' : ''}`}>
                <span className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-300 text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className={`flex-1 text-sm font-medium ${done ? (isCorrect ? 'text-emerald-200' : 'text-red-200') : 'text-white'}`}>
                  {items[itemIdx]}
                </span>
                {!done && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => moveUp(i)} disabled={i === 0}
                      className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs flex items-center justify-center">
                      ▲
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === order.length - 1}
                      className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs flex items-center justify-center">
                      ▼
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!done && (
          <button onClick={() => onSubmit(order)}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
            Submit Order
          </button>
        )}
      </div>
    );
  }

  // ── 7. Short Answer (1-3 sentences, manual review) ──────────────────────────
  if (type === 'shortanswer') {
    return (
      <div className="space-y-3">
        <textarea
          disabled={done}
          value={done ? (answer || '') : fillVal}
          onChange={e => setFillVal(e.target.value)}
          placeholder="Write 1-3 sentences…"
          rows={3}
          className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500 transition resize-none placeholder:text-slate-500"
        />
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI auto-grading + trainer review
        </p>
        {!done && fillVal.trim() && (
          <button onClick={() => onSubmit(fillVal.trim())}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
            Submit Answer
          </button>
        )}
      </div>
    );
  }

  // ── 8. Essay (extended response, manual review) ─────────────────────────────
  if (type === 'essay') {
    return (
      <div className="space-y-3">
        <textarea
          disabled={done}
          value={done ? (answer || '') : fillVal}
          onChange={e => setFillVal(e.target.value)}
          placeholder="Write your detailed response here…"
          rows={8}
          className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500 transition resize-y placeholder:text-slate-500"
        />
        <div className="flex justify-between items-center text-xs text-slate-500">
          <p className="flex items-center gap-1 text-amber-400">
            <Sparkles className="w-3 h-3" />
            AI auto-grading + trainer review
          </p>
          <span>{fillVal.length} characters</span>
        </div>
        {!done && fillVal.trim().length >= 50 && (
          <button onClick={() => onSubmit(fillVal.trim())}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
            Submit Essay
          </button>
        )}
        {!done && fillVal.trim().length < 50 && (
          <p className="text-xs text-slate-500 text-center">Minimum 50 characters required</p>
        )}
      </div>
    );
  }

  // ── 9. Code Submission (student writes code, manual review) ────────────────
  if (type === 'code') {
    return (
      <div className="space-y-3">
        <textarea
          disabled={done}
          value={done ? (answer || '') : fillVal}
          onChange={e => setFillVal(e.target.value)}
          placeholder={`// Write your code here...\n${q.language || 'javascript'}`}
          rows={12}
          className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-emerald-300 text-sm font-mono focus:outline-none focus:border-violet-500 transition resize-y placeholder:text-slate-600"
        />
        <div className="flex justify-between items-center text-xs">
          <p className="flex items-center gap-1 text-amber-400">
            <Code2 className="w-3 h-3" />
            AI auto-grading + trainer review
          </p>
          <span className="text-slate-500">{fillVal.split('\n').length} lines</span>
        </div>
        {!done && fillVal.trim() && (
          <button onClick={() => onSubmit(fillVal.trim())}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
            Submit Code
          </button>
        )}
      </div>
    );
  }

  // ── 10. File Upload (doc/pdf/zip, manual review) ───────────────────────────
  if (type === 'fileupload') {
    return (
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          disabled={done}
          accept=".pdf,.doc,.docx,.zip,.rar,.txt"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setAnswers(a => ({ ...a, [idx]: { file: f, name: f.name, size: f.size } }));
            }
          }}
          className="hidden"
        />
        <button
          disabled={done}
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-xl bg-slate-800 hover:bg-slate-800/60 transition group"
        >
          <FileText className="w-6 h-6 text-slate-500 group-hover:text-violet-400 transition" />
          <div className="text-left">
            <p className="text-sm font-medium text-white">Click to upload file</p>
            <p className="text-xs text-slate-500">PDF, DOC, DOCX, ZIP, RAR, TXT (max 10MB)</p>
          </div>
        </button>
        {file && (
          <div className="flex items-center gap-3 px-4 py-3 bg-violet-500/10 border border-violet-500/30 rounded-xl">
            <FileText className="w-5 h-5 text-violet-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!done && (
              <button onClick={() => { setFile(null); setAnswers(a => ({ ...a, [idx]: null })); }}
                className="text-xs text-red-400 hover:text-red-300">Remove</button>
            )}
          </div>
        )}
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI auto-grading + trainer review
        </p>
        {!done && file && (
          <button onClick={() => onSubmit({ file, name: file.name, size: file.size })}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
            Submit File
          </button>
        )}
      </div>
    );
  }

  // ── 11. Drawing/Diagram (image upload, manual review) ──────────────────────
  if (type === 'drawing') {
    return (
      <div className="space-y-3">
        <input
          ref={imageInputRef}
          type="file"
          disabled={done}
          accept="image/*"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) {
              setImage(f);
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                setPreview(dataUrl);
                setAnswers(a => ({ ...a, [idx]: { file: f, name: f.name, preview: dataUrl } }));
              };
              reader.readAsDataURL(f);
            }
          }}
          className="hidden"
        />
        <button
          disabled={done}
          onClick={() => imageInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-xl bg-slate-800 hover:bg-slate-800/60 transition group"
        >
          <Sparkles className="w-6 h-6 text-slate-500 group-hover:text-violet-400 transition" />
          <div className="text-left">
            <p className="text-sm font-medium text-white">Upload drawing or diagram</p>
            <p className="text-xs text-slate-500">PNG, JPG, SVG, or take a photo</p>
          </div>
        </button>
        {preview && (
          <div className="border-2 border-violet-500/30 rounded-xl overflow-hidden bg-slate-950">
            <img src={preview} alt="Drawing preview" className="w-full h-auto max-h-96 object-contain" />
            {image && (
              <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">{image.name} • {(image.size / 1024).toFixed(1)} KB</span>
                {!done && (
                  <button onClick={() => { setImage(null); setPreview(null); setAnswers(a => ({ ...a, [idx]: null })); }}
                    className="text-xs text-red-400 hover:text-red-300">Remove</button>
                )}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI auto-grading + trainer review
        </p>
        {!done && image && (
          <button onClick={() => onSubmit({ file: image, name: image.name, preview })}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition">
            Submit Drawing
          </button>
        )}
      </div>
    );
  }

  // ── 12. Audio Response (voice recording, manual review) ────────────────────
  if (type === 'audio') {
    // audioFileRef declared at top of component (hooks rule)
    const selectedFile = answer as File | null;

    const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setAnswers(a => ({ ...a, [idx]: file }));
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-8 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800 hover:border-violet-500 transition cursor-pointer"
          onClick={() => !done && audioFileRef.current?.click()}>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-3xl">🎤</span>
          </div>
          {selectedFile ? (
            <>
              <p className="text-sm font-medium text-white">✓ {selectedFile.name}</p>
              <p className="text-xs text-emerald-400">Audio file selected ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-white">Click to upload audio file</p>
              <p className="text-xs text-slate-500 text-center max-w-xs">Supported formats: MP3, WAV, M4A, OGG</p>
            </>
          )}
        </div>
        <input
          ref={audioFileRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.ogg"
          onChange={handleAudioFileSelect}
          disabled={done}
          className="hidden"
        />
        {selectedFile && !done && (
          <button onClick={() => onSubmit(selectedFile)}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg">
            Submit Audio
          </button>
        )}
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI auto-grading + trainer review
        </p>
      </div>
    );
  }

  // ── 13. Video Response (video submission, manual review) ───────────────────
  if (type === 'video') {
    // videoFileRef declared at top of component (hooks rule)
    const selectedFile = answer as File | null;

    const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setAnswers(a => ({ ...a, [idx]: file }));
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center gap-3 px-5 py-8 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800 hover:border-violet-500 transition cursor-pointer"
          onClick={() => !done && videoFileRef.current?.click()}>
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-3xl">📹</span>
          </div>
          {selectedFile ? (
            <>
              <p className="text-sm font-medium text-white">✓ {selectedFile.name}</p>
              <p className="text-xs text-emerald-400">Video file selected ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-white">Click to upload video file</p>
              <p className="text-xs text-slate-500 text-center max-w-xs">Supported formats: MP4, MOV, AVI, MKV, WebM</p>
            </>
          )}
        </div>
        <input
          ref={videoFileRef}
          type="file"
          accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
          onChange={handleVideoFileSelect}
          disabled={done}
          className="hidden"
        />
        {selectedFile && !done && (
          <button onClick={() => onSubmit(selectedFile)}
            className="w-full px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg">
            Submit Video
          </button>
        )}
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI auto-grading + trainer review
        </p>
      </div>
    );
  }

  // Fallback for unknown normalizedTypes
  return (
    <div className="text-center py-8 text-slate-500">
      <p className="text-sm">Question type "{type}" not yet supported.</p>
    </div>
  );
}

// ─── Secure assignment launcher ──────────────────────────────────────────────

/**
 * SecureAssignmentLauncher — Launches assignment in fullscreen anti-cheat mode.
 * Same security as quiz: all shortcuts blocked, no exit until submitted.
 */
function SecureAssignmentLauncher({ block }: { block: any }) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="my-4 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border-2 border-amber-500/30">
            <ClipboardList className="w-8 h-8 text-amber-400" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-extrabold text-white text-xl flex items-center gap-2 leading-tight">
                {block.title || "Assignment"}
              </h4>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                {block.description || "Complete this assignment under exam conditions."}
              </p>
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {block.points && (
                <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  ⭐ {block.points} points
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🔒 Secure fullscreen mode
              </span>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                ⚠️ All shortcuts blocked
              </span>
            </div>

            {/* Warning box */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 space-y-2">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Assignment Rules
              </p>
              <ul className="text-slate-300 text-xs space-y-1.5 leading-relaxed pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Once started, you <strong className="text-white">cannot exit</strong> until submission.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>All keyboard shortcuts are <strong className="text-white">blocked</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Leaving fullscreen will <strong className="text-white">auto-submit</strong> your work.</span>
                </li>
              </ul>
            </div>

            {/* Start button */}
            <button
              onClick={() => setStarted(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white text-base
                bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 hover:from-amber-500 hover:via-orange-500 hover:to-yellow-500
                shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="text-xl">📝</span>
              <span>Start Secure Assignment</span>
            </button>

            <p className="text-center text-[10px] text-slate-500 leading-relaxed">
              By clicking "Start", you agree to the rules and acknowledge that the anti-cheat system will activate.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Assignment started — render in secure fullscreen mode
  return <SecureAssignmentSession block={block} onExit={() => setStarted(false)} />;
}

// ─── Secure assignment session ───────────────────────────────────────────────

function SecureAssignmentSession({ block, onExit }: { block: any; onExit: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  // ── ELECTRON ANTI-CHEAT: Enter OS-level lockdown on mount ──────────────────
  useEffect(() => {
    if (!window.electronAPI) {
      console.error('❌ CRITICAL: electronAPI not available! This app must run in Electron.');
      alert('⚠️ This application must be run as a desktop app, not in a web browser.');
      return;
    }

    console.log('🔒 Starting Electron OS-level exam mode for assignment');

    // Enter ultra-secure exam mode
    window.electronAPI.examModeEnter({
      quizId: block.id || 'assignment',
      title: block.title || 'Assignment',
      submissionId: `assignment-${Date.now()}`,
      startTime: Date.now(),
    }).then((result) => {
      console.log('✅ Electron exam mode activated for assignment:', result);
    }).catch((err) => {
      console.error('❌ Failed to start Electron exam mode:', err);
    });

    // Listen for auto-submit events from Electron
    window.electronAPI.onAutoSubmit((data) => {
      console.log('🚨 Electron triggered auto-submit for assignment:', data);
      alert('⚠️ Security violation detected. Your assignment has been auto-submitted.');
      setSubmitted(true);
      setTimeout(() => onExit(), 1000);
    });

    // Cleanup on unmount
    return () => {
      console.log('🔓 Exiting Electron exam mode');
      window.electronAPI?.examModeExit().then(() => {
        console.log('✅ Electron exam mode deactivated');
      }).catch(() => { });
    };
  }, [submitted, onExit]);

  if (submitted) {
    return (
      <div className="my-6 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <span className="text-4xl">✅</span>
        </div>
        <h3 className="text-2xl font-extrabold text-white">Assignment Submitted!</h3>
        <p className="text-slate-300">Your work has been recorded. Your trainer will review it soon.</p>
        <button onClick={onExit}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition">
          Exit Secure Mode
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-[99999] overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white">{block.title || "Assignment"}</h2>
            {block.points && <p className="text-amber-400 text-sm mt-1">⭐ Worth {block.points} points</p>}
          </div>
          <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold border border-red-500/30">
            🔒 Secure Mode Active
          </span>
        </div>

        {/* Assignment content */}
        <StudentAssignment block={block} />

        {/* Submit button */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <button
            onClick={() => {
              if (confirm('Submit your assignment? You cannot change it after submission.')) {
                setSubmitted(true);
              }
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition"
          >
            ✓ Submit Assignment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Secure quiz session ─────────────────────────────────────────────────────

/**
 * The actual quiz UI that runs inside the anti-cheat fullscreen lockdown.
 * This component mounts AFTER the user clicks "Start Quiz" and automatically
 * activates the anti-cheat system.
 */
function SecureQuizSession({ block, onExit }: { block: any; onExit: () => void }) {
  const originalQuestions: any[] = block.questions || [];

  // ─── WEEK 3+: Question Randomization ─────────────────────────────────────────
  // Each student gets questions in a different random order to prevent cooperation.
  // We use a deterministic shuffle based on user ID + quiz ID so the same student
  // always sees the same order (important for crash recovery).
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionMap, setQuestionMap] = useState<Map<number, number>>(new Map()); // randomIndex -> originalIndex

  useEffect(() => {
    // Generate a deterministic seed based on user + quiz
    const userId = window.electronAPI ? 'electron-user' : 'web-user'; // TODO: Get from auth
    const quizId = block.id || 'default-quiz';
    const seed = `${userId}-${quizId}`;

    // Deterministic shuffle using seed
    const shuffled = [...originalQuestions];
    const mapping = new Map<number, number>();

    // Simple deterministic shuffle based on seed hash
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    // Fisher-Yates shuffle with seeded random
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Generate pseudo-random number based on seed + index
      hash = (hash * 9301 + 49297) % 233280;
      const j = Math.floor((hash / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Build mapping: randomized index -> original index
    for (let i = 0; i < shuffled.length; i++) {
      const originalIdx = originalQuestions.findIndex(q => q === shuffled[i]);
      mapping.set(i, originalIdx);
    }

    setQuestions(shuffled);
    setQuestionMap(mapping);

    console.log('[SecureQuiz] Questions randomized:', {
      original: originalQuestions.length,
      shuffled: shuffled.length,
      seed,
      mapping: Array.from(mapping.entries()),
    });
  }, [block.id]); // Re-shuffle if quiz changes

  // DEBUG: Log quiz data at start
  console.log('[SecureQuiz] Starting quiz with', questions.length, 'questions');
  console.log('[SecureQuiz] window.electronAPI available?', !!window.electronAPI);
  console.log('[SecureQuiz] window.isElectron?', window.isElectron);
  // ────────────────────────────────────────────────────────────────────────────

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [fillVal, setFillVal] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submissionId, setSubmissionIdState] = useState<string | null>(null);

  // ── CRASH RECOVERY STATE ────────────────────────────────────────────────────
  const [recoverySessionId, setRecoverySessionId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Track elapsed time in ms
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [interruptedSession, setInterruptedSession] = useState<any>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── OFFLINE SUBMISSION STATE ────────────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);

  // ── CHECK FOR INTERRUPTED SESSION ON MOUNT ──────────────────────────────────
  useEffect(() => {
    async function checkInterruptedSession() {
      if (!window.electronAPI?.recoveryCheckInterrupted) return;

      // Get current user ID (from session or context)
      // For now, use a placeholder - in production, get from auth context
      const userId = 'current-user'; // TODO: Get from useUser() or similar

      try {
        const interrupted = await window.electronAPI.recoveryCheckInterrupted(userId);
        if (interrupted) {
          console.log('🚨 [CRASH RECOVERY] Interrupted session detected:', interrupted);
          setInterruptedSession(interrupted);
          setShowResumeDialog(true);
        }
      } catch (error) {
        console.error('❌ [CRASH RECOVERY] Error checking interrupted session:', error);
      }
    }

    checkInterruptedSession();
  }, []);

  // ── HANDLE RESUME FROM CRASH ───────────────────────────────────────────────
  const handleResumeSession = async () => {
    if (!interruptedSession || !window.electronAPI?.recoveryResumeSession) return;

    try {
      const session = await window.electronAPI.recoveryResumeSession(interruptedSession.sessionId);
      console.log('🔄 [CRASH RECOVERY] Resuming session:', session);

      // Restore state from recovered session
      setRecoverySessionId(session.sessionId);
      setAnswers(session.answers || {});
      setIdx(session.currentQuestionIdx || 0);
      setElapsedTime(session.elapsedMs || 0);
      sessionStartTimeRef.current = Date.now() - (session.elapsedMs || 0);

      // Mark restored answers as submitted
      const restoredSubmitted: Record<number, boolean> = {};
      Object.keys(session.answers || {}).forEach(key => {
        restoredSubmitted[parseInt(key)] = true;
      });
      setSubmitted(restoredSubmitted);

      setShowResumeDialog(false);
      setInterruptedSession(null);

      console.log('✅ [CRASH RECOVERY] Session resumed successfully');
    } catch (error) {
      console.error('❌ [CRASH RECOVERY] Error resuming session:', error);
      alert('Failed to resume session. Starting fresh.');
      handleDiscardSession();
    }
  };

  const handleDiscardSession = async () => {
    if (!interruptedSession || !window.electronAPI?.recoveryDiscardSession) return;

    try {
      await window.electronAPI.recoveryDiscardSession(interruptedSession.sessionId);
      console.log('🗑️ [CRASH RECOVERY] Session discarded');
      setShowResumeDialog(false);
      setInterruptedSession(null);
    } catch (error) {
      console.error('❌ [CRASH RECOVERY] Error discarding session:', error);
    }
  };

  // ── START CRASH RECOVERY SESSION ON MOUNT ──────────────────────────────────
  useEffect(() => {
    async function startRecoverySession() {
      // Don't start if we're resuming an interrupted session
      if (interruptedSession || recoverySessionId) return;
      if (!window.electronAPI?.recoveryStartSession) return;

      const nodeId = block._nodeId as string | undefined;
      const blockId = (block.id || block._blockKey) as string | undefined;
      const trackId = block._trackId as string | undefined;
      const userId = 'current-user'; // TODO: Get from auth context

      if (!nodeId || !blockId) {
        console.warn('⚠️ [CRASH RECOVERY] Missing nodeId/blockId, cannot start recovery session');
        return;
      }

      try {
        const result = await window.electronAPI.recoveryStartSession({
          userId,
          nodeId,
          blockId,
          trackId: trackId || '',
          questions,
        });
        setRecoverySessionId(result.sessionId);
        sessionStartTimeRef.current = Date.now();
        console.log('✅ [CRASH RECOVERY] Session started:', result.sessionId);
      } catch (error) {
        console.error('❌ [CRASH RECOVERY] Error starting session:', error);
      }
    }

    // Only start if not showing resume dialog
    if (!showResumeDialog) {
      startRecoverySession();
    }
  }, [showResumeDialog, interruptedSession, recoverySessionId, block, questions]);

  // ── ELAPSED TIME TRACKER (UPDATE EVERY SECOND) ─────────────────────────────
  useEffect(() => {
    if (!window.electronAPI?.recoveryUpdateTimer || !recoverySessionId) return;

    elapsedTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - sessionStartTimeRef.current;
      setElapsedTime(elapsed);
      window.electronAPI?.recoveryUpdateTimer(elapsed);
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [recoverySessionId]);

  // ── AUTO-SAVE ANSWERS ON CHANGE (IMMEDIATE) ────────────────────────────────
  useEffect(() => {
    if (!window.electronAPI?.recoverySaveAnswer || !recoverySessionId) return;

    // Save all current answers to crash recovery
    Object.entries(answers).forEach(([questionIdx, answer]) => {
      const idx = parseInt(questionIdx);
      const answerData: any = {};

      // Normalize answer format
      if (typeof answer === 'number') {
        answerData.answerChoice = answer;
      } else if (typeof answer === 'string') {
        answerData.answerText = answer;
      } else if (Array.isArray(answer)) {
        answerData.answerText = JSON.stringify(answer);
      } else if (answer instanceof File) {
        answerData.answerText = answer.name; // File object - store name
      } else if (answer && typeof answer === 'object') {
        answerData.answerText = JSON.stringify(answer);
      }

      window.electronAPI?.recoverySaveAnswer(idx, answerData);
    });
  }, [answers, recoverySessionId]);

  // ── LISTEN FOR SYNC STATUS CHANGES (OFFLINE DETECTION) ─────────────────────
  useEffect(() => {
    if (!window.electronAPI?.onSyncStatusChanged) return;

    window.electronAPI.onSyncStatusChanged((status) => {
      setSyncStatus(status);
      setIsOffline(!status.isOnline);
      console.log('📊 [SYNC STATUS]', status);
    });

    // Get initial sync status
    window.electronAPI.syncGetStatus?.().then(setSyncStatus).catch(console.error);
  }, []);

  // ── Electron audit integration ──────────────────────────────────────────────
  // Track question navigation for time-per-question + crash recovery
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.markQuestionStart) {
      window.electronAPI.markQuestionStart(idx);
    }
    // Update current question in crash recovery
    if (typeof window !== 'undefined' && window.electronAPI?.recoveryUpdateQuestion && recoverySessionId) {
      window.electronAPI.recoveryUpdateQuestion(idx);
    }
  }, [idx, recoverySessionId]);

  // Block paste at document level + log attempt
  useEffect(() => {
    const blockPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      if (typeof window !== 'undefined' && window.electronAPI?.auditEvent) {
        const text = e.clipboardData?.getData('text') || '';
        window.electronAPI.auditEvent('PASTE_BLOCKED', {
          questionIdx: idx,
          preview: text.slice(0, 80),
        });
      }
      console.warn('📋 Paste blocked during exam');
    };
    document.addEventListener('paste', blockPaste);
    return () => document.removeEventListener('paste', blockPaste);
  }, [idx]);

  // ── PER-QUESTION TIMER ──────────────────────────────────────────────────────
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer for current question
  useEffect(() => {
    const currentQuestion = questions[idx];
    if (!currentQuestion || submitted[idx] || quizSubmitted) {
      // Stop timer if question is already submitted or quiz is done
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeRemaining(0);
      return;
    }

    // Get time limit for this question (in seconds)
    const timeLimit = currentQuestion.timeLimit || 60; // Default 60 seconds
    setTimeRemaining(timeLimit);

    console.log(`[Timer] Starting timer for Q${idx + 1}: ${timeLimit} seconds`);

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time expired - auto-advance to next question
          console.log(`[Timer] Time expired for Q${idx + 1}, auto-advancing`);

          // Clear timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Mark as submitted with current answer (or empty if no answer)
          setSubmitted(s => ({ ...s, [idx]: true }));

          // Move to next question after a brief delay
          setTimeout(() => {
            if (idx < questions.length - 1) {
              setIdx(idx + 1);
              setFillVal('');
            } else {
              // Last question - auto-submit quiz
              console.log('[Timer] Last question time expired, auto-submitting quiz');
              handleQuizSubmit(true);
            }
          }, 500);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or question change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [idx, submitted, quizSubmitted, questions]);

  // ── ELECTRON ANTI-CHEAT: Enter OS-level lockdown on mount ──────────────────
  useEffect(() => {
    if (!window.electronAPI) {
      console.error('❌ CRITICAL: electronAPI not available! This app must run in Electron.');
      alert('⚠️ This application must be run as a desktop app, not in a web browser.');
      return;
    }

    console.log('🔒 Starting Electron OS-level exam mode');

    // Enter ultra-secure exam mode (kiosk, blocks ALL shortcuts at OS level)
    window.electronAPI.examModeEnter({
      quizId: block.id || 'quiz',
      title: block.title || 'Quiz',
      submissionId: `quiz-${Date.now()}`,
      startTime: Date.now(),
    }).then((result) => {
      console.log('✅ Electron exam mode activated:', result);
    }).catch((err) => {
      console.error('❌ Failed to start Electron exam mode:', err);
    });

    // Listen for auto-submit events from Electron (window blur, focus loss, etc.)
    window.electronAPI.onAutoSubmit((data) => {
      console.log('🚨 Electron triggered auto-submit:', data);
      handleQuizSubmit(true);
    });

    // Cleanup on unmount
    return () => {
      console.log('🔓 Exiting Electron exam mode');
      window.electronAPI?.examModeExit().then(() => {
        console.log('✅ Electron exam mode deactivated');
      }).catch(() => { });
    };
  }, []);

  const q = questions[idx];
  if (!q && !quizSubmitted) return null;

  const done = submitted[idx];

  const submit = (val: any) => {
    setAnswers(a => ({ ...a, [idx]: val }));
    setSubmitted(s => ({ ...s, [idx]: true }));
  };

  const correct = done ? checkQ(q, answers[idx]) : null;
  const allDone = questions.every((_, i) => submitted[i]);
  const score = questions.filter((q, i) => submitted[i] && checkQ(q, answers[i])).length;

  const handleQuizSubmit = async (autoSubmitted = false) => {
    setQuizSubmitted(true);

    const nodeId = block._nodeId as string | undefined;
    const trackId = block._trackId as string | undefined;
    const blockId = (block.id || block._blockKey) as string | undefined;

    const subjectiveTypes = ['shortanswer', 'essay', 'code', 'fileupload', 'drawing', 'audio', 'video'];

    // ── POST every answer to /api/quiz/response ───────────────────────────
    // Each call upserts a QuizResponse row and updates the QuizBlockSubmission.
    // The last call (or any with totalQuestions set) finalises the submission row.
    //
    // WEEK 3+: Map randomized question index back to original index for storage.
    // This ensures the teacher sees answers in the correct order regardless of
    // student's randomized question order.
    let realSubmissionId: string | null = null;

    if (nodeId && blockId) {
      const answerPromises = questions.map(async (q: any, randomizedIdx: number) => {
        // Map randomized index to original index
        const originalIdx = questionMap.get(randomizedIdx) ?? randomizedIdx;

        const rawType = q.questionType || q.type || 'mcq';
        const questionType = rawType === 'short' ? 'shortanswer'
          : rawType === 'coding' ? 'code'
            : rawType === 'file_upload' ? 'fileupload'
              : rawType === 'drawing_upload' ? 'drawing'
                : rawType === 'audio_response' ? 'audio'
                  : rawType === 'video_response' ? 'video'
                    : rawType;

        const ans = answers[randomizedIdx]; // Get answer from student's randomized order

        // Determine answerChoice (numeric) and answerText (serialised)
        let answerChoice: number | undefined;
        let answerText: string | undefined;

        if (autoSubmitted && ans === undefined) {
          // No answer recorded — mark as auto-submitted sentinel
          answerText = '[AUTO-SUBMITTED]';
        } else if (questionType === 'mcq' || questionType === 'truefalse') {
          answerChoice = typeof ans === 'number' ? ans : undefined;
        } else if (questionType === 'multiselect' || questionType === 'ordering') {
          answerText = Array.isArray(ans) ? JSON.stringify(ans) : undefined;
        } else if (questionType === 'matching') {
          answerText = ans && typeof ans === 'object' ? JSON.stringify(ans) : undefined;
        } else if (questionType === 'fillin') {
          answerText = typeof ans === 'string' ? JSON.stringify([ans]) : undefined;
        } else if (['shortanswer', 'essay', 'code'].includes(questionType)) {
          answerText = typeof ans === 'string' ? ans : undefined;
        } else if (['fileupload', 'drawing', 'audio', 'video'].includes(questionType)) {
          // File answers — upload to server so teacher can preview/play them
          const fileObj: File | null = ans instanceof File ? ans : (ans?.file instanceof File ? ans.file : null);
          if (fileObj && nodeId && blockId) {
            try {
              const fd = new FormData();
              fd.append('file', fileObj);
              fd.append('nodeId', nodeId);
              fd.append('blockId', blockId);
              fd.append('questionIdx', String(originalIdx)); // Use original index for storage
              const uploadRes = await fetch('/api/quiz/upload-answer', { method: 'POST', body: fd });
              const uploadData = await uploadRes.json();
              if (uploadData.fileUrl) {
                // Store the real URL in answerText so the response API can access it
                answerText = uploadData.fileUrl;
              } else {
                // Upload failed — fall back to filename only
                answerText = fileObj.name;
                console.warn(`[SecureQuiz] File upload failed for Q${originalIdx + 1}:`, uploadData.error);
              }
            } catch (uploadErr) {
              answerText = fileObj?.name ?? '[file]';
              console.warn(`[SecureQuiz] File upload error for Q${originalIdx + 1}:`, uploadErr);
            }
          } else {
            answerText = ans?.name ?? ans?.file?.name ?? '[file]';
          }
        }

        try {
          // If answerText looks like a file URL, also pass it as fileUrl
          const isUploadedFile = answerText?.startsWith('/uploads/');
          const res = await fetch('/api/quiz/response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodeId,
              blockId,
              trackId: trackId ?? '',
              questionIdx: originalIdx, // Use original index for storage in database
              questionType,
              answerChoice,
              answerText,
              ...(isUploadedFile ? { fileUrl: answerText } : {}),
              totalQuestions: questions.length,
            }),
          });
          const data = await res.json();
          if (data.submissionId) realSubmissionId = data.submissionId;
          if (!res.ok) {
            console.warn(`[SecureQuiz] ⚠️ Q${originalIdx + 1} (randomized as ${randomizedIdx + 1}) response failed:`, data.error);
          }
        } catch (err) {
          console.error(`[SecureQuiz] ❌ Q${originalIdx + 1} (randomized as ${randomizedIdx + 1}) response error:`, err);
        }
      });

      // Submit all answers (parallel — order doesn't matter for upsert)
      await Promise.allSettled(answerPromises);
      console.log('[SecureQuiz] ✅ All answers submitted. submissionId:', realSubmissionId);

      // NOTE: AI grading of subjective questions is the TEACHER's responsibility.
      // It is triggered from the EnhancedQuizGradingDashboard, not from the student.
      // Calling bulk-ai-grade here would fail with "Only trainers can grade".
    } else {
      console.warn('[SecureQuiz] ⚠️ Missing nodeId/blockId — answers not saved to DB.');
    }

    // ── Exit Electron exam mode ───────────────────────────────────────────
    if (window.electronAPI) {
      console.log('🔓 Exiting Electron exam mode');
      try {
        await window.electronAPI.examModeExit();
        console.log('✅ Electron exam mode deactivated');
      } catch (error) {
        console.error('❌ Normal exit failed, attempting force exit:', error);
        try {
          await window.electronAPI.forceExitExam();
          console.log('✅ Force exit successful');
        } catch (forceError) {
          console.error('❌ Force exit also failed:', forceError);
        }
      }
    }

    // ── Return to content after 3 s ───────────────────────────────────────
    setTimeout(() => {
      try {
        onExit();
      } catch (err) {
        console.error('❌ onExit() failed:', err);
        window.location.href = '/dashboard';
      }
    }, 3000);
  };

  // Show results screen after submission
  if (quizSubmitted) {
    const subjectiveTypes = ['shortanswer', 'essay', 'code', 'fileupload', 'drawing', 'audio', 'video'];
    const hasSubjective = questions.some(q => subjectiveTypes.includes(q.questionType));

    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border-4 border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Quiz Submitted!</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your answers have been recorded and are being processed.
          </p>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-white text-lg font-bold">{score} / {questions.length}</p>
              <p className="text-slate-400 text-xs">Auto-graded (objective questions)</p>
            </div>

            {hasSubjective && (
              <div className="pt-3 border-t border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-medium">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  AI Auto-Grading in Progress
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Your essay, code, and file upload answers are being analyzed by AI.
                  Your trainer will review and finalize your grade.
                </p>
              </div>
            )}
          </div>

          <p className="text-slate-500 text-xs">Returning to content in 3 seconds…</p>
        </div>
      </div>
    );
  }

  // Main quiz UI
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{block.title || "Secure Quiz"}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-slate-400 text-sm">Question {idx + 1} of {questions.length}</p>
              {/* WEEK 3+: Randomization indicator */}
              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-xs font-medium border border-violet-500/30">
                🔀 Randomized Order
              </span>
            </div>
          </div>
          <div className="text-right space-y-2">
            {/* Timer Display */}
            {!submitted[idx] && timeRemaining > 0 && (
              <div className={`text-2xl font-bold tabular-nums ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' :
                timeRemaining <= 30 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                ⏱️ {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>
            )}
            {submitted[idx] && (
              <div className="text-sm text-slate-400">✓ Submitted</div>
            )}
            <p className="text-xs text-slate-500">Electron anti-cheat active</p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Secure Mode
            </div>
          </div>
        </div>

        {/* Progress dots - no going back to previous questions */}
        <div className="flex gap-2 flex-wrap justify-center">
          {questions.map((_, i) => {
            const isAccessible = i < idx || (i === idx); // Current or already passed
            const isPast = i < idx;

            return (
              <button key={i}
                onClick={() => {
                  // Can only go back to already-submitted questions (not forward)
                  if (isPast && submitted[i]) {
                    setIdx(i);
                    setFillVal('');
                  }
                }}
                disabled={!isAccessible || (i === idx)}
                className={`w-10 h-10 rounded-full text-sm font-bold transition
                  ${i === idx ? 'bg-violet-600 text-white ring-4 ring-violet-600/30' : ''}
                  ${submitted[i] && i < idx ? (checkQ(questions[i], answers[i]) ? 'bg-emerald-600 text-white cursor-pointer hover:ring-2 hover:ring-emerald-500' : 'bg-red-600 text-white cursor-pointer hover:ring-2 hover:ring-red-500') : ''}
                  ${i > idx ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : ''}
                  ${!submitted[i] && i < idx ? 'bg-slate-700 text-slate-400' : ''}`}
                title={i > idx ? 'Not yet available' : i === idx ? 'Current question' : submitted[i] ? 'Review submitted answer' : 'Skipped question'}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <div className="bg-slate-900/80 border-2 border-slate-700 rounded-2xl p-6 space-y-4">
          <p className="text-white font-semibold text-lg leading-relaxed">{q.question}</p>

          <QuestionInput
            question={q}
            answer={answers[idx]}
            done={done}
            onSubmit={submit}
            fillVal={fillVal}
            setFillVal={setFillVal}
            setAnswers={setAnswers}
            idx={idx}
          />

          {/* Feedback */}
          {done && q.explanation && (
            <div className={`p-4 rounded-xl text-sm flex gap-3 border-2 ${correct
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
              <div className="shrink-0">
                {correct ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <p className="font-bold mb-1">{correct ? 'Correct!' : 'Not quite right'}</p>
                <p className="leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          {/* REMOVED Previous button - students cannot go back */}
          <div className="text-sm text-slate-500">
            {done ? '✓ Answer submitted' : timeRemaining > 0 ? `Time: ${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}` : ''}
          </div>

          <div className="flex gap-3">
            {/* Next Question button - only show after submitting or if last question */}
            {done && idx < questions.length - 1 && (
              <button onClick={() => { setIdx(idx + 1); setFillVal(''); }}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition shadow-lg">
                Next Question →
              </button>
            )}

            {/* Submit Quiz button - show when all done */}
            {allDone && (
              <button onClick={() => handleQuizSubmit(false)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg">
                ✓ Submit Quiz ({score}/{questions.length})
              </button>
            )}

            {/* Submit Incomplete - show if not all done and on last question */}
            {!allDone && idx === questions.length - 1 && (
              <button
                onClick={() => {
                  if (confirm(`You have only answered ${Object.keys(submitted).length} out of ${questions.length} questions. Submit anyway?`)) {
                    handleQuizSubmit(false);
                  }
                }}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg">
                Submit Incomplete Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interactive quiz ─────────────────────────────────────────────────────────

function StudentQuiz({ block }: { block: any }) {
  // If this quiz is marked as "secured", show a launcher button instead of inline quiz
  if (block.secured === true || block.secureMode === true) {
    return <SecureQuizLauncher block={block} />;
  }

  // Otherwise render inline practice quiz with new QuestionInput component
  const questions: any[] = block.questions || [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [fillVal, setFillVal] = useState('');
  const q = questions[idx];
  if (!q) return null;

  const done = submitted[idx];

  const submit = (val: any) => {
    setAnswers(a => ({ ...a, [idx]: val }));
    setSubmitted(s => ({ ...s, [idx]: true }));
  };

  const correct = done ? checkQ(q, answers[idx]) : null;
  const allDone = questions.every((_, i) => submitted[i]);
  const score = questions.filter((q, i) => submitted[i] && checkQ(q, answers[i])).length;

  return (
    <div className="my-4 rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-white flex items-center gap-2 text-lg">🎯 Practice Quiz</h4>
        {allDone && <span className="text-sm font-bold text-white bg-purple-600 px-3 py-1 rounded-full">Score: {score}/{questions.length}</span>}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {questions.map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); setFillVal(''); }}
            className={`w-7 h-7 rounded-full text-xs font-bold transition
              ${i === idx ? 'bg-violet-600 text-white' : ''}
              ${submitted[i] && i !== idx ? (checkQ(questions[i], answers[i]) ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : ''}
              ${!submitted[i] && i !== idx ? 'bg-slate-700 text-slate-300' : ''}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700 space-y-3">
        <p className="text-white font-medium">{q.question}</p>

        <QuestionInput
          question={q}
          answer={answers[idx]}
          done={done}
          onSubmit={submit}
          fillVal={fillVal}
          setFillVal={setFillVal}
          setAnswers={setAnswers}
          idx={idx}
        />

        {/* Feedback */}
        {done && q.explanation && (
          <div className={`p-3 rounded-lg text-sm flex gap-2 ${correct ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200' : 'bg-amber-500/10 border border-amber-500/30 text-amber-200'}`}>
            {correct ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <X className="w-4 h-4 mt-0.5 shrink-0" />}
            {q.explanation}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-3">
        <button disabled={idx === 0} onClick={() => { setIdx(i => i - 1); setFillVal(''); }}
          className="text-xs text-slate-400 hover:text-white disabled:opacity-30 px-3 py-1">← Prev</button>
        <button disabled={idx === questions.length - 1} onClick={() => { setIdx(i => i + 1); setFillVal(''); }}
          className="text-xs text-slate-400 hover:text-white disabled:opacity-30 px-3 py-1">Next →</button>
      </div>
    </div>
  );
}

function checkQ(q: any, answer: any): boolean {
  if (answer === undefined || answer === null) return false;
  if (q.questionType === 'mcq' || q.questionType === 'truefalse') return answer === q.correct;
  if (q.questionType === 'multiselect') {
    const a = [...(answer as number[])].sort(); const c = [...(Array.isArray(q.correct) ? q.correct : [])].sort();
    return JSON.stringify(a) === JSON.stringify(c);
  }
  if (q.questionType === 'fillin') return (q.blanks || []).some((b: string) => b.toLowerCase().trim() === (answer as string).toLowerCase().trim());
  return false;
}

// ─── Checklist ────────────────────────────────────────────────────────────────

function StudentChecklist({ block }: { block: any }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const items: string[] = block.items || [];
  const pct = items.length ? Math.round((checked.size / items.length) * 100) : 0;
  return (
    <div className="my-4 rounded-xl border border-slate-700 bg-slate-900/50 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-400" />
          {block.title || 'Self-Assessment Checklist'}
        </h4>
        <span className={`text-sm font-medium ${pct === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
          {checked.size}/{items.length} {pct === 100 ? '🎉' : ''}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <button key={i} onClick={() => setChecked(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
            className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg border transition
              ${checked.has(i) ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'}`}>
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${checked.has(i) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'}`}>
              {checked.has(i) && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${checked.has(i) ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{item}</span>
          </button>
        ))}
      </div>
      {pct === 100 && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
          <Star className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm font-medium">All items checked — great work!</p>
        </div>
      )}
    </div>
  );
}

// ─── Assignment ───────────────────────────────────────────────────────────────

function StudentAssignment({ block }: { block: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-6 h-6 text-amber-400 shrink-0" />
        <div className="flex-1">
          <h3 className="text-white font-semibold">{block.title}</h3>
          {block.points && <p className="text-amber-300 text-sm">⭐ {block.points} points</p>}
        </div>
      </div>
      {block.description && (
        <>
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 transition">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {open ? 'Hide Instructions' : 'View Instructions'}
          </button>
          {open && (
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700">
              {renderBlock({ normalizedType: 'text', content: block.description })}
            </div>
          )}
        </>
      )}
      {block.allowedFormats && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          Formats: {(block.allowedFormats as string[]).map(f => (
            <span key={f} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded font-mono">.{f}</span>
          ))}
          {block.maxFileSize && <span>(max {block.maxFileSize}MB)</span>}
        </div>
      )}
      <div className="border border-dashed border-slate-600 rounded-xl p-5 text-center">
        <FileText className="w-7 h-7 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Submit this assignment to your instructor</p>
      </div>
    </div>
  );
}

// ─── TOC Sidebar (identical logic to TrainerModuleViewer's TOCSidebar) ────────

function TOCSidebar({
  toc, activeId, viewedIds, onSelect,
}: {
  toc: TOCItem[];
  activeId: string | null;
  viewedIds: Set<string>;
  onSelect: (item: TOCItem, blockKey?: string) => void;
}) {
  const outcomes = toc.filter(t => t.type === 'outcome');
  const [openOutcomes, setOpenOutcomes] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(outcomes.map((o, i) => [o.id, i === 0])));
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});
  const [openSubtopics, setOpenSubtopics] = useState<Record<string, boolean>>({});

  const topicsFor = (pid: string) => toc.filter(t => t.type === 'topic' && t.parentId === pid);
  const subsFor = (pid: string) => toc.filter(t => t.type === 'subtopic' && t.parentId === pid);

  function outcomePct(oid: string) {
    const subs = toc.filter(t => t.type === 'subtopic' && (() => {
      const tp = toc.find(x => x.id === t.parentId); return tp?.parentId === oid;
    })());
    if (!subs.length) return viewedIds.has(oid) ? 100 : 0;
    return Math.round(subs.filter(s => viewedIds.has(s.id)).length / subs.length * 100);
  }

  if (!toc.length) return (
    <div className="px-4 py-8 text-center text-slate-500 text-sm">No table of contents yet.</div>
  );

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
            <button
              onClick={() => { onSelect(outcome); setOpenOutcomes(p => ({ ...p, [outcome.id]: !p[outcome.id] })); }}
              className={`w-full text-left flex items-start gap-2.5 px-4 py-2.5 rounded-xl mx-2 transition border
                ${isActive ? `${LO_COLORS.bgActive} ${LO_COLORS.borderActive} ${LO_COLORS.textActive} shadow-lg shadow-blue-500/20`
                  : `${LO_COLORS.bg} ${LO_COLORS.border} ${LO_COLORS.text} ${LO_COLORS.bgHover}`}`}
              style={{ width: 'calc(100% - 1rem)' }}>
              <span className={`mt-0.5 shrink-0 ${LO_COLORS.icon}`}><OutcomeIcon index={oi} /></span>
              <span className="flex-1 text-xs font-bold leading-snug">{outcome.title}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {outcome.hours && <span className="text-[9px] font-mono opacity-60">{outcome.hours}h</span>}
                {oPct > 0 && <span className={`text-[9px] font-bold ${oDone ? 'text-emerald-400' : 'text-amber-400'}`}>{oDone ? <Check className="w-3 h-3" /> : `${oPct}%`}</span>}
                <ChevronRight className={`w-3 h-3 ${LO_COLORS.icon} transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </div>
            </button>
            {oPct > 0 && (
              <div className="mx-6 mb-1 h-[2px] rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${oDone ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${oPct}%` }} />
              </div>
            )}
            {isOpen && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                {topics.map(topic => {
                  const subs = subsFor(topic.id);
                  const isTopicOpen = openTopics[topic.id];
                  const isTopicActive = activeId === topic.id;
                  const subsViewed = subs.filter(s => viewedIds.has(s.id)).length;
                  return (
                    <div key={topic.id}>
                      <button
                        onClick={() => { onSelect(topic); if (subs.length) setOpenTopics(p => ({ ...p, [topic.id]: !p[topic.id] })); }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition text-xs border
                          ${isTopicActive ? `${TOPIC_COLORS.bgActive} ${TOPIC_COLORS.borderActive} ${TOPIC_COLORS.textActive} font-semibold`
                            : `${TOPIC_COLORS.bg} ${TOPIC_COLORS.border} ${TOPIC_COLORS.text} ${TOPIC_COLORS.bgHover}`}`}>
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${viewedIds.has(topic.id) ? TOPIC_COLORS.dot : 'bg-slate-700'}`} />
                        <span className="flex-1 leading-snug">{topic.title}</span>
                        {subs.length > 0 && <span className="text-[9px] text-slate-600 shrink-0">{subsViewed}/{subs.length}</span>}
                        {subs.length > 0 && <ChevronRight className={`w-2.5 h-2.5 ${TOPIC_COLORS.icon} shrink-0 transition-transform ${isTopicOpen ? 'rotate-90' : ''}`} />}
                      </button>
                      {isTopicOpen && subs.map(sub => {
                        const subViewed = viewedIds.has(sub.id);
                        const hasItems = sub.items && sub.items.length > 0;
                        const subOpen = openSubtopics[sub.id] || false;
                        return (
                          <div key={sub.id}>
                            <button
                              onClick={() => { onSelect(sub); if (hasItems) setOpenSubtopics(p => ({ ...p, [sub.id]: !p[sub.id] })); }}
                              className={`w-full text-left flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-lg transition text-[11px] border
                                ${activeId === sub.id ? `${SUBTOPIC_COLORS.bgActive} ${SUBTOPIC_COLORS.borderActive} ${SUBTOPIC_COLORS.textActive} font-medium`
                                  : `${SUBTOPIC_COLORS.bg} ${SUBTOPIC_COLORS.border} ${SUBTOPIC_COLORS.text} ${SUBTOPIC_COLORS.textHover}`}`}>
                              <span className={`shrink-0 w-1 h-1 rounded-full ${subViewed ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                              <span className="flex-1 leading-snug">{sub.title}</span>
                              {hasItems && <span className="text-[9px] text-slate-600 shrink-0">{sub.items!.length}</span>}
                              {hasItems && <ChevronRight className={`w-2.5 h-2.5 ${SUBTOPIC_COLORS.icon} shrink-0 transition-transform ${subOpen ? 'rotate-90' : ''}`} />}
                              {!hasItems && subViewed && <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
                            </button>
                            {subOpen && hasItems && (
                              <div className="ml-4 mt-0.5 space-y-0.5">
                                {sub.items!.map((itemText, itemIdx) => {
                                  const outIdx = outcomes.findIndex(o => o.id === outcome.id);
                                  const topicIdx = topics.findIndex(t => t.id === topic.id);
                                  const subIdx = subs.findIndex(s => s.id === sub.id);
                                  const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;
                                  const isItemActive = activeId === itemId;
                                  return (
                                    <button key={itemIdx}
                                      onClick={() => {
                                        const pseudo: any = { id: itemId, normalizedType: 'item', title: itemText, parentId: sub.id, _isItem: true, _parentSubtopic: sub };
                                        onSelect(pseudo, itemId);
                                      }}
                                      className={`w-full text-left flex items-start gap-1.5 pl-7 pr-3 py-1 rounded-lg transition text-[10px] leading-snug border
                                        ${isItemActive ? `${ITEM_COLORS.bgActive} ${ITEM_COLORS.borderActive} ${ITEM_COLORS.textActive}`
                                          : `${ITEM_COLORS.bg} ${ITEM_COLORS.border} ${ITEM_COLORS.text} ${ITEM_COLORS.textHover}`}`}>
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

// ─── Content Panel (student-facing, no edit buttons) ─────────────────────────

function ContentPanel({
  item, toc, liveBlocks, tierColor, trackName, trackId, blockKeyToNodeId,
}: {
  item: TOCItem | null;
  toc: TOCItem[];
  liveBlocks: Record<string, any[]>;
  tierColor: string;
  trackName: string;
  trackId: string;
  blockKeyToNodeId: Record<string, string>;
}) {
  // Augment a block with _trackId and _nodeId so SecureQuizLauncher
  // can enforce one-attempt and submit real answers to the API.
  const augment = (b: any, blockKey: string) => ({
    ...b,
    _trackId: trackId,
    _nodeId: blockKeyToNodeId[blockKey] ?? null,
    _blockKey: blockKey,
  });

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <h2 className="text-xl font-bold text-white mb-2">Select a topic to start learning</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          Click any learning outcome, topic or subtopic on the left to view its content.
        </p>
      </div>
    );
  }

  // ── Learning Outcome ──────────────────────────────────────────────────────
  if (item.type === 'outcome') {
    const topics = toc.filter(t => t.type === 'topic' && t.parentId === item.id);
    const outIdx = toc.filter(t => t.type === 'outcome').findIndex(o => o.id === item.id);

    // Exact same key as teacher: default-outcome-{outIdx}
    // Fallback to raw section keys (intro/tools/safety/practice) for seeded content
    const outcomeKey = `default-outcome-${outIdx}`;
    const sectionKeys = Object.keys(liveBlocks).filter(k => !k.startsWith('default-') && !k.match(/^\w+-\d/));
    const blocks = liveBlocks[outcomeKey]
      ?? (outIdx < sectionKeys.length ? liveBlocks[sectionKeys[outIdx]] : undefined)
      ?? liveBlocks[item.id]
      ?? [];


    return (
      <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className={`rounded-3xl bg-gradient-to-br ${tierColor} p-8 text-white shadow-2xl`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl"><OutcomeIcon index={outIdx} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Learning Outcome {outIdx + 1}</p>
              <h1 className="text-2xl font-extrabold leading-tight">{item.title}</h1>
            </div>
          </div>
          {item.hours && (
            <div className="flex items-center gap-4 mt-4 text-sm opacity-90">
              <span>🕐 {item.hours} learning hours</span>
              <span>•</span>
              <span><BookOpen className="w-4 h-4 inline" /> {topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        {blocks.length > 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-400" /> Overview</h2>
            {blocks.map((b, i) => <div key={i}>{renderBlock(augment(b, outcomeKey))}</div>)}
          </div>
        )}
        {(item as any).performanceCriteria?.length > 0 && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-3">
            <h2 className="font-bold text-white flex items-center gap-2"><ListChecks className="w-4 h-4" /> Performance Criteria</h2>
            <ul className="space-y-2">
              {(item as any).performanceCriteria.map((pc: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br ${tierColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{i + 1}</span>
                  {pc}
                </li>
              ))}
            </ul>
          </div>
        )}
        {topics.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-white flex items-center gap-2"><Pin className="w-4 h-4" /> Topics</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {topics.map((tp, ti) => {
                const subs = toc.filter(t => t.type === 'subtopic' && t.parentId === tp.id);
                const tpKey = `default-topic-${outIdx}-${ti}`;
                const tpHasContent = !!(liveBlocks[tpKey] ?? liveBlocks[tp.id]);
                return (
                  <div key={tp.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${tierColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{ti + 1}</span>
                      <h3 className="font-semibold text-white text-sm leading-snug">{tp.title}</h3>
                      {tpHasContent && <span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Content</span>}
                    </div>
                    <p className="text-xs text-slate-500">{subs.length} subtopic{subs.length !== 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Topic ────────────────────────────────────────────────────────────────
  if (item.type === 'topic') {
    const subtopics = toc.filter(t => t.type === 'subtopic' && t.parentId === item.id);
    const parentOutcome = toc.find(t => t.type === 'outcome' && t.id === item.parentId);

    // Exact same key as teacher: default-topic-{outIdx}-{topicIdx}
    const outIdx = toc.filter(t => t.type === 'outcome').findIndex(o => o.id === item.parentId);
    const topicsInOutcome = toc.filter(t => t.type === 'topic' && t.parentId === item.parentId);
    const topicIdx = topicsInOutcome.findIndex(t => t.id === item.id);
    const topicKey = `default-topic-${outIdx}-${topicIdx}`;
    const blocks = liveBlocks[topicKey] ?? liveBlocks[item.id] ?? [];

    return (
      <div className="p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {parentOutcome && (
          <p className="text-xs text-slate-500">
            <span className="text-slate-400">{parentOutcome.title}</span>
            <span className="mx-2">›</span>
            <span className="text-white font-medium">{item.title}</span>
          </p>
        )}
        <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <div className="flex items-center gap-3">
            <Pin className="w-7 h-7 text-green-400" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Indicative Content / Topic</p>
              <h1 className="text-xl font-extrabold text-white">{item.title}</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-400">{subtopics.length} subtopic{subtopics.length !== 1 ? 's' : ''} in this topic.</p>
        </div>

        {/* Teacher-added overview content for this topic */}
        {blocks.length > 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-green-400" /> Topic Content</h2>
            {blocks.map((b, i) => <div key={i}>{renderBlock(augment(b, topicKey))}</div>)}
          </div>
        )}

        {/* Subtopics overview list */}
        <div className="space-y-3">
          {subtopics.map((sub, si) => {
            const subKey = `default-subtopic-${outIdx}-${topicIdx}-${si}`;
            const subHasContent = !!(liveBlocks[subKey] ?? liveBlocks[sub.id]);
            return (
              <div key={sub.id} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${tierColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{si + 1}</span>
                  <h3 className="font-semibold text-white text-sm">{sub.title}</h3>
                  {subHasContent && <span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Content</span>}
                </div>
                {sub.items && sub.items.length > 0 && (
                  <ul className="pl-8 mt-1 space-y-0.5">
                    {sub.items.map((it, ii) => <li key={ii} className="text-xs text-slate-400 flex gap-1.5"><Dot className="w-3 h-3 mt-0.5 shrink-0" />{it}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Subtopic ─────────────────────────────────────────────────────────────
  if (item.type === 'subtopic' && !(item as any)._isItem) {
    const parentTopic = toc.find(t => t.type === 'topic' && t.id === item.parentId);
    const parentOutcome = toc.find(t => t.type === 'outcome' && t.id === parentTopic?.parentId);
    const outcomes = toc.filter(t => t.type === 'outcome');
    const outIdx = outcomes.findIndex(o => o.id === parentOutcome?.id);
    const topicsList = toc.filter(t => t.type === 'topic' && t.parentId === parentOutcome?.id);
    const topicIdx = topicsList.findIndex(t => t.id === parentTopic?.id);
    const subsList = toc.filter(t => t.type === 'subtopic' && t.parentId === parentTopic?.id);
    const subIdx = subsList.findIndex(s => s.id === item.id);

    // Exact same key as teacher: default-subtopic-{outIdx}-{topicIdx}-{subIdx}
    const defaultKey = `default-subtopic-${outIdx}-${topicIdx}-${subIdx}`;
    // Also fall back to section-named keys for seeded content (intro/tools/safety/practice)
    const sectionKeys = Object.keys(liveBlocks).filter(k => !k.startsWith('default-') && !k.match(/^\w+-\d/));
    const globalSubIdx = toc.filter(t => t.type === 'subtopic').findIndex(s => s.id === item.id);
    const blocks = liveBlocks[defaultKey]
      ?? liveBlocks[item.id]
      ?? (globalSubIdx >= 0 && globalSubIdx < sectionKeys.length ? liveBlocks[sectionKeys[globalSubIdx]] : undefined)
      ?? [];
    return (
      <div className="p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <p className="text-xs text-slate-500">
          {parentOutcome && <><span className="text-slate-400">{parentOutcome.title}</span><span className="mx-2">›</span></>}
          {parentTopic && <><span className="text-slate-400">{parentTopic.title}</span><span className="mx-2">›</span></>}
          <span className="text-white font-medium">{item.title}</span>
        </p>
        <div className={`rounded-3xl bg-gradient-to-br ${tierColor} p-0.5 shadow-2xl`}>
          <div className="rounded-[22px] bg-slate-950 p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-orange-400">◈</span>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Indicative Content</p>
                <h1 className="text-lg font-extrabold text-white">{item.title}</h1>
              </div>
            </div>
            {item.items && item.items.length > 0 && (
              <ul className="mt-4 space-y-1.5 pl-2">
                {item.items.map((it, ii) => <li key={ii} className="flex items-start gap-2 text-sm text-slate-300"><Dot className="w-4 h-4 mt-1 text-slate-500 shrink-0" />{it}</li>)}
              </ul>
            )}
          </div>
        </div>
        {blocks.length > 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-400" /> Content</h2>
            {blocks.map((b, i) => <div key={i}>{renderBlock(augment(b, defaultKey))}</div>)}
          </div>
        )}
        {blocks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500 text-sm">
            Content for this section is being prepared. Check back soon!
          </div>
        )}
      </div>
    );
  }

  // ── Item (4th level) ─────────────────────────────────────────────────────
  if ((item as any)._isItem || (item as any).normalizedType === 'item') {
    const parentSub: TOCItem | undefined = (item as any)._parentSubtopic ?? toc.find(t => t.type === 'subtopic' && t.id === item.parentId);
    const parentTopic = toc.find(t => t.type === 'topic' && t.id === parentSub?.parentId);
    const parentOutcome = toc.find(t => t.type === 'outcome' && t.id === parentTopic?.parentId);
    // The item's id IS the block key (set as `default-item-${oIdx}-${tIdx}-${sIdx}-${iIdx}` in sidebar)
    const blocks = liveBlocks[item.id] ?? [];
    return (
      <div className="p-6 md:p-10 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <p className="text-xs text-slate-500">
          {parentOutcome && <><span className="text-slate-400">{parentOutcome.title}</span><span className="mx-2">›</span></>}
          {parentTopic && <><span className="text-slate-400">{parentTopic.title}</span><span className="mx-2">›</span></>}
          {parentSub && <><span className="text-slate-400">{parentSub.title}</span><span className="mx-2">›</span></>}
          <span className="text-white font-medium">{item.title}</span>
        </p>
        <div className={`rounded-3xl bg-gradient-to-br ${tierColor} p-0.5 shadow-2xl`}>
          <div className="rounded-[22px] bg-slate-950 p-6">
            <div className="flex items-center gap-3">
              <Pin className="w-7 h-7 text-yellow-400" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Curriculum Item</p>
                <h1 className="text-lg font-extrabold text-white">{item.title}</h1>
              </div>
            </div>
          </div>
        </div>
        {blocks.length > 0 ? (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /> Learning Content</h2>
            {blocks.map((b, i) => <div key={i}>{renderBlock(augment(b, item.id))}</div>)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500 text-sm">
            Content for this item is being prepared. Check back soon!
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentModuleViewer({ track, customTocEntries, user, progress }: Props) {
  const router = useRouter();

  // ── Debug logging ──
  console.log('📊 [StudentModuleViewer] Props received:', {
    trackTableOfContents: track.tableOfContents,
    isTableOfContentsArray: Array.isArray(track.tableOfContents),
    customTocEntries,
    isCustomTocEntriesArray: Array.isArray(customTocEntries),
  });

  // ── Apply custom TOC edits (same algorithm as TrainerModuleViewer.displayToc) ──
  const baseToc = (Array.isArray(track.tableOfContents) ? track.tableOfContents : []) as TOCItem[];
  const safeCustomTocEntries = Array.isArray(customTocEntries) ? customTocEntries : [];

  console.log('📊 [StudentModuleViewer] Safe values:', {
    baseToc,
    baseTocLength: baseToc.length,
    safeCustomTocEntries,
    safeCustomTocEntriesLength: safeCustomTocEntries.length,
  });

  const displayToc: TOCItem[] = (() => {
    if (safeCustomTocEntries.length === 0) return baseToc;

    const customBySourceId = new Map<string, CustomTocEntry>();
    safeCustomTocEntries.forEach(e => { if (e.sourceId) customBySourceId.set(e.sourceId, e); });

    const processed: (TOCItem & { _customOrder?: number })[] = baseToc.map(item => {
      const ce = customBySourceId.get(item.id);
      if (ce) return { ...item, title: ce.title, hours: ce.hours ?? item.hours, _customOrder: ce.order };
      return item;
    });

    // Append net-new entries (no sourceId)
    safeCustomTocEntries.forEach(e => {
      if (!e.sourceId) {
        processed.push({
          id: e.id,
          type: e.type === 'learningOutcome' ? 'outcome' : e.type as TOCItem['type'],
          title: e.title,
          hours: e.hours ?? undefined,
          parentId: e.parentId ?? undefined,
          items: [],
          _customOrder: e.order,
        });
      }
    });

    const grouped = new Map<string, (TOCItem & { _customOrder?: number })[]>();
    processed.forEach(item => {
      const key = `${item.type}-${item.parentId || 'root'}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    });
    grouped.forEach(group => group.sort((a, b) => {
      const ha = '_customOrder' in a, hb = '_customOrder' in b;
      if (ha && hb) return (a._customOrder ?? 0) - (b._customOrder ?? 0);
      if (ha) return -1; if (hb) return 1; return 0;
    }));

    const final: TOCItem[] = [];
    (grouped.get('outcome-root') || []).forEach(outcome => {
      final.push(outcome);
      (grouped.get(`topic-${outcome.id}`) || []).forEach(topic => {
        final.push(topic);
        (grouped.get(`subtopic-${topic.id}`) || []).forEach(sub => {
          final.push(sub);
          final.push(...(grouped.get(`item-${sub.id}`) || []));
        });
        final.push(...(grouped.get(`item-${topic.id}`) || []));
      });
    });
    return final;
  })();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeItem, setActiveItem] = useState<TOCItem | null>(() => {
    const firstOutcome = displayToc.find(t => t.type === 'outcome') ?? null;
    return firstOutcome;
  });
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  // Sync activeItem when displayToc refreshes (teacher renamed/reordered an item)
  // Keep the same item selected, just pull the freshest version from displayToc
  useEffect(() => {
    if (!activeItem) return;
    const refreshed = displayToc.find(t => t.id === activeItem.id);
    if (refreshed && (refreshed.title !== activeItem.title || refreshed.hours !== activeItem.hours)) {
      setActiveItem(refreshed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCustomTocEntries]);
  // Initialise liveBlocks from the server-passed node data immediately (no flash)
  const [liveBlocks, setLiveBlocks] = useState<Record<string, any[]>>(() => {
    const combined: Record<string, any[]> = {};
    track.nodes.forEach(n => {
      if (n.blocks && typeof n.blocks === 'object') {
        Object.entries(n.blocks).forEach(([k, v]) => {
          if (!k.includes('--')) {
            combined[k] = v as any[];
          }
        });
      }
    });
    return combined;
  });

  // Sync liveBlocks whenever server refreshes track.nodes (after router.refresh())
  useEffect(() => {
    const combined: Record<string, any[]> = {};
    track.nodes.forEach(n => {
      if (n.blocks && typeof n.blocks === 'object') {
        Object.entries(n.blocks).forEach(([k, v]) => {
          if (!k.includes('--')) combined[k] = v as any[];
        });
      }
    });
    setLiveBlocks(combined);
  }, [track.nodes]);

  // Map from block key → nodeId, so ContentPanel can tell SecureQuizLauncher
  // which node a quiz block belongs to (needed for API calls).
  const blockKeyToNodeId = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    track.nodes.forEach(n => {
      if (n.blocks && typeof n.blocks === 'object') {
        Object.keys(n.blocks as Record<string, unknown>).forEach(k => {
          if (!k.includes('--')) map[k] = n.id;
        });
      }
    });
    return map;
  }, [track.nodes]);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'updated'>('idle');

  const tierColor = track.name.toLowerCase().includes('l3') || track.name.toLowerCase().includes('level 3')
    ? 'from-emerald-500 to-teal-600'
    : track.name.toLowerCase().includes('l5') || track.name.toLowerCase().includes('level 5')
      ? 'from-violet-500 to-purple-700'
      : 'from-sky-500 to-blue-600';

  // ── SSE: subscribe to teacher changes, refresh server component + blocks ──
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      es = new EventSource(`/api/track/${track.id}/sync-stream`);

      es.onmessage = (evt) => {
        try {
          const event = JSON.parse(evt.data);
          if (event.type === 'connected') return;

          // Teacher changed something — refresh server component.
          // This re-runs the page server function, gets fresh track.nodes +
          // customTocEntries from Prisma, and passes them as new props.
          // The useEffect([track.nodes]) and inline displayToc recompute
          // automatically, so student sees updated content with no extra fetch.
          setSyncStatus('syncing');
          router.refresh();
          setTimeout(() => setSyncStatus('updated'), 600);
          setTimeout(() => setSyncStatus('idle'), 3000);
        } catch { /* malformed event — ignore */ }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        // Auto-reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [track.id, router]);

  // Mark item as viewed when selected + save progress to DB
  const handleSelect = (item: TOCItem) => {
    setActiveItem(item);
    setViewedIds(prev => new Set([...prev, item.id]));

    // TODO: Progress tracking temporarily disabled to debug content rendering
    // // Find the node linked to this TOC item and record "studying"
    // // The node title often matches the outcome title — check nodes
    // const linkedNode = track.nodes.find(n => {
    //   const nLow = n.title.toLowerCase().substring(0, 25);
    //   const iLow = item.title.toLowerCase().substring(0, 25);
    //   return nLow.includes(iLow) || iLow.includes(nLow);
    // });
    // if (linkedNode && item.type === 'outcome') {
    //   fetch(`/api/learn/track/${track.id}/progress`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ nodeId: linkedNode.id, readPct: Math.max(progress[linkedNode.id]?.readPct ?? 0, 10), status: "studying" }),
    //   }).catch(() => { });
    // }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-72 flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs text-violet-300 font-medium uppercase tracking-wider flex-1">Module</span>
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1 text-blue-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-[10px]">Syncing…</span>
              </div>
            )}
            {syncStatus === 'updated' && (
              <div className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3 h-3" />
                <span className="text-[10px]">Updated</span>
              </div>
            )}
          </div>
          <h2 className="text-sm font-bold text-white leading-snug">{track.name}</h2>
          {track.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{track.description}</p>}
        </div>

        {/* TOC */}
        <div className="flex-1 overflow-y-auto">
          <TOCSidebar
            toc={displayToc}
            activeId={activeItem?.id ?? null}
            viewedIds={viewedIds}
            onSelect={handleSelect}
          />
        </div>

        {/* User strip */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-500">{user.xp.toLocaleString()} XP</p>
          </div>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto"
        onScroll={e => {
          // Track reading progress by scroll depth
          const el = e.currentTarget;
          const scrolled = el.scrollTop + el.clientHeight;
          const total = el.scrollHeight;
          if (total <= el.clientHeight) return; // no scroll needed
          const pct = Math.round((scrolled / total) * 100);

          // TODO: Progress tracking temporarily disabled to debug content rendering
          // // Find the linked node for the active outcome item
          // if (!activeItem || activeItem.type !== 'outcome') return;
          // const linkedNode = track.nodes.find(n => {
          //   const nLow = n.title.toLowerCase().substring(0, 25);
          //   const iLow = activeItem.title.toLowerCase().substring(0, 25);
          //   return nLow.includes(iLow) || iLow.includes(nLow);
          // });
          // if (!linkedNode) return;

          // // Only save every 10% to avoid flooding
          // const current = progress[linkedNode.id]?.readPct ?? 0;
          // const rounded = Math.floor(pct / 10) * 10;
          // if (rounded > current) {
          //   const status = rounded >= 100 ? "done" : "studying";
          //   fetch(`/api/learn/track/${track.id}/progress`, {
          //     method: "POST",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify({ nodeId: linkedNode.id, readPct: rounded, status }),
          //   }).catch(() => { });
          // }
        }}
      >
        <ContentPanel
          item={activeItem}
          toc={displayToc}
          liveBlocks={liveBlocks}
          tierColor={tierColor}
          trackName={track.name}
          trackId={track.id}
          blockKeyToNodeId={blockKeyToNodeId}
        />
      </main>
    </div>
  );
}
