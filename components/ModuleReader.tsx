"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap, ListChecks, Lightbulb, Check, Play, Edit3
} from "lucide-react";
import ModuleEditor from "./ModuleEditor";
import SecureExamDetector from "./SecureExamDetector";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockBase = { id: string };
type TextBlock = BlockBase & { type: "text"; content: string };
type VideoBlock = BlockBase & { type: "video"; url: string; caption?: string };
type CodeBlock = BlockBase & { type: "code"; language: string; starter: string; solution?: string; hint?: string };
type QuizBlock = BlockBase & { type: "quiz"; question: string; options: string[]; correct: number; explanation?: string };
type ChecklistBlock = BlockBase & { type: "checklist"; items: string[] };
type Block = TextBlock | VideoBlock | CodeBlock | QuizBlock | ChecklistBlock;

type BlockProgressRecord = { blockId: string; state: string; payload?: Record<string, unknown> };

type NodeData = {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  estimatedMinutes: number;
  videoUrl: string | null;
  blocks: object[];
  track: { id: string; name: string; icon: string | null };
  progress: {
    id: string;
    status: string;
    readPct: number;
    verifiedAt: string | null;
    evidenceUrl: string | null;
  } | null;
  blockProgress: BlockProgressRecord[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function renderMarkdown(md: string) {
  // Minimal markdown: bold, inline code, headings, line breaks
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-800 px-1.5 py-0.5 text-sky-300 text-sm font-mono">$1</code>')
    .replace(/\n/g, "<br />");
}

// ─── Block components ─────────────────────────────────────────────────────────

function TextBlockView({ block, onRead }: { block: TextBlock; onRead: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          onRead();
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onRead]);

  return (
    <div
      ref={ref}
      className="prose prose-invert max-w-none text-slate-300 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(block.content) }}
    />
  );
}

function VideoBlockView({ block, onRead }: { block: VideoBlock; onRead: () => void }) {
  const ytId = youtubeId(block.url);
  const fired = useRef(false);
  function handlePlay() {
    if (!fired.current) { fired.current = true; onRead(); }
  }
  return (
    <div className="space-y-2">
      {ytId ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            onLoad={handlePlay}
          />
        </div>
      ) : (
        <video
          src={block.url}
          controls
          className="w-full rounded-2xl bg-slate-900"
          onPlay={handlePlay}
        />
      )}
      {block.caption && <p className="text-center text-xs text-slate-500">{block.caption}</p>}
    </div>
  );
}

function QuizBlockView({
  block,
  saved,
  onAnswer,
}: {
  block: QuizBlock;
  saved: BlockProgressRecord | undefined;
  onAnswer: (state: string, payload: Record<string, unknown>) => void;
}) {
  const [chosen, setChosen] = useState<number | null>(
    saved?.payload?.chosen !== undefined ? (saved.payload.chosen as number) : null
  );
  const [revealed, setRevealed] = useState(!!saved);

  function submit() {
    if (chosen === null) return;
    const correct = chosen === block.correct;
    setRevealed(true);
    onAnswer(correct ? "correct" : "wrong", { chosen });
  }

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 space-y-4">
      <p className="font-semibold text-white">🧠 {block.question}</p>
      <div className="space-y-2">
        {block.options.map((opt, i) => {
          let cls = "border-slate-700 bg-slate-800 text-slate-300 hover:border-sky-500/50";
          if (revealed) {
            if (i === block.correct) cls = "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
            else if (i === chosen) cls = "border-red-500/60 bg-red-500/10 text-red-300";
            else cls = "border-slate-700 bg-slate-800 text-slate-500";
          } else if (chosen === i) {
            cls = "border-sky-500/60 bg-sky-500/10 text-sky-300";
          }
          return (
            <button
              key={i}
              disabled={revealed}
              onClick={() => setChosen(i)}
              className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {!revealed && (
        <button
          disabled={chosen === null}
          onClick={submit}
          className="rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-white transition"
        >
          Submit answer
        </button>
      )}
      {revealed && (
        <div className={`rounded-xl px-4 py-3 text-sm ${chosen === block.correct ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
          {chosen === block.correct ? "✦ Correct!" : `✗ Incorrect — correct answer: "${block.options[block.correct]}"`}
          {block.explanation && <p className="mt-1 text-slate-400">{block.explanation}</p>}
        </div>
      )}
    </div>
  );
}

function ChecklistBlockView({
  block,
  saved,
  onCheck,
}: {
  block: ChecklistBlock;
  saved: BlockProgressRecord | undefined;
  onCheck: (checked: boolean[], allDone: boolean) => void;
}) {
  const initial = saved?.payload?.checked as boolean[] | undefined;
  const [checked, setChecked] = useState<boolean[]>(
    initial ?? block.items.map(() => false)
  );

  function toggle(i: number) {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    onCheck(next, next.every(Boolean));
  }

  const allDone = checked.every(Boolean);

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 inline-flex items-center gap-1"><ListChecks className="w-4 h-4" /> Checklist</p>
      {block.items.map((item, i) => (
        <label key={i} className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() => toggle(i)}
            className="mt-0.5 h-4 w-4 accent-amber-400 rounded"
          />
          <span className={`text-sm transition ${checked[i] ? "line-through text-slate-500" : "text-slate-300"}`}>
            {item}
          </span>
        </label>
      ))}
      {allDone && (
        <p className="text-xs text-emerald-400 font-semibold">✦ All tasks complete!</p>
      )}
    </div>
  );
}

function CodeBlockView({
  block,
  saved,
  onRun,
}: {
  block: CodeBlock;
  saved: BlockProgressRecord | undefined;
  onRun: (code: string) => void;
}) {
  const [code, setCode] = useState<string>(
    (saved?.payload?.code as string) ?? block.starter
  );
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [ran, setRan] = useState(saved?.state === "ran");

  function handleRun() {
    setRan(true);
    onRun(code);
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
          💻 Code — {block.language}
        </span>
        <div className="flex gap-2">
          {block.hint && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              {showHint ? "Hide hint" : <><Lightbulb className="w-4 h-4 inline" /> Hint</>}
            </button>
          )}
          {block.solution && ran && (
            <button
              onClick={() => setShowSolution((v) => !v)}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              {showSolution ? "Hide solution" : "Show solution"}
            </button>
          )}
        </div>
      </div>
      {showHint && <p className="text-xs text-amber-300 bg-amber-500/10 rounded-xl px-3 py-2">{block.hint}</p>}
      <textarea
        rows={8}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-200 focus:border-violet-500 focus:outline-none resize-y"
      />
      {showSolution && block.solution && (
        <pre className="rounded-xl border border-emerald-800/40 bg-emerald-900/10 px-4 py-3 font-mono text-sm text-emerald-300 overflow-x-auto whitespace-pre-wrap">
          {block.solution}
        </pre>
      )}
      <button
        onClick={handleRun}
        className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition"
      >
        {ran ? <><Check className="w-4 h-4 inline" /> Submitted</> : <><Play className="w-4 h-4 inline" /> Submit code</>}
      </button>
    </div>
  );
}

// ─── Main ModuleReader ────────────────────────────────────────────────────────

export default function ModuleReader({
  node,
  userId,
  userXp,
  canEdit,
}: {
  node: NodeData;
  userId: string;
  userXp: number;
  canEdit: boolean;
}) {
  // Defensive: ensure blocks is an array (SQLite may return JSON string)
  let blocksArray: Block[] = [];
  try {
    if (typeof node.blocks === 'string') {
      blocksArray = JSON.parse(node.blocks);
    } else if (Array.isArray(node.blocks)) {
      blocksArray = node.blocks as Block[];
    }
  } catch (e) {
    console.error('[ModuleReader] Failed to parse blocks:', e);
    blocksArray = [];
  }
  const blocks = blocksArray;
  const [blockStates, setBlockStates] = useState<Record<string, BlockProgressRecord>>(() => {
    const map: Record<string, BlockProgressRecord> = {};
    for (const bp of node.blockProgress) map[bp.blockId] = bp;
    return map;
  });
  const [readPct, setReadPct] = useState(node.progress?.readPct ?? 0);
  const [nodeStatus, setNodeStatus] = useState(node.progress?.status ?? "not_started");
  const [celebrating, setCelebrating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [, startTransition] = useTransition();
  const celebrationFired = useRef(false);

  const totalBlocks = blocks.length;

  const completedCount = Object.values(blockStates).filter((bp) =>
    ["read", "correct", "checked", "ran"].includes(bp.state)
  ).length;

  const liveReadPct = totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0;

  // Check if this module contains quiz blocks (triggers secure mode)
  const hasQuizzes = blocks.some((block) => block.type === "quiz");

  // Celebrate on 100%
  useEffect(() => {
    if (liveReadPct >= 100 && !celebrationFired.current) {
      celebrationFired.current = true;
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 4000);
    }
  }, [liveReadPct]);

  const saveBlockProgress = useCallback(
    (blockId: string, state: string, payload: Record<string, unknown> = {}) => {
      setBlockStates((prev) => ({ ...prev, [blockId]: { blockId, state, payload } }));
      startTransition(async () => {
        const res = await fetch(`/api/modules/${node.id}/block-progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId, state, payload }),
        });
        if (res.ok) {
          const data = await res.json();
          setReadPct(data.readPct);
          setNodeStatus(data.status);
        }
      });
    },
    [node.id]
  );

  if (editMode && canEdit) {
    return (
      <div className="container py-10 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditMode(false)} className="text-sm text-slate-400 hover:text-white">
            ← Back to reader
          </button>
          <h1 className="text-xl font-bold text-white">{node.title} — Edit</h1>
        </div>
        <ModuleEditor
          nodeId={node.id}
          initialBlocks={blocks}
          estimatedMinutes={node.estimatedMinutes}
          videoUrl={node.videoUrl}
          description={node.description}
          onSaved={() => setEditMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Secure Exam Mode Detector - activates when module contains quizzes */}
      {hasQuizzes && (
        <SecureExamDetector
          assessmentType="quiz"
          assessmentTitle={node.title}
          nodeId={node.id}
          trackId={node.track.id}
          autoActivate={true}
        />
      )}

      {/* Celebration overlay */}
      {celebrating && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce text-center">
            <p className="text-6xl">🎉</p>
            <p className="mt-3 text-2xl font-black text-white drop-shadow-lg">Module Complete!</p>
            <p className="text-emerald-400 font-semibold">+{node.xpReward} XP incoming</p>
          </div>
          {/* Confetti dots */}
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-2 w-2 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ["#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"][i % 5],
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${0.6 + Math.random() * 0.8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Sticky top progress bar */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="container flex items-center gap-4 py-3">
          <Link href="/passport" className="text-sm text-slate-400 hover:text-white shrink-0">
            ← {node.track.icon} {node.track.name}
          </Link>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${liveReadPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 shrink-0">{liveReadPct}%</span>
          {canEdit && (
            <button
              onClick={() => setEditMode(true)}
              className="shrink-0 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition"
            >
              <Edit3 className="w-4 h-4 inline" /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="container max-w-3xl py-10 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${nodeStatus === "verified" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" :
              nodeStatus === "done" ? "border-sky-500/50 bg-sky-500/10 text-sky-300" :
                nodeStatus === "studying" ? "border-amber-500/50 bg-amber-500/10 text-amber-300" :
                  "border-slate-700 bg-slate-800 text-slate-400"
              }`}>
              {nodeStatus === "verified" ? "✦ Verified" :
                nodeStatus === "done" ? "◉ Done — awaiting verification" :
                  nodeStatus === "studying" ? "◎ In progress" : "○ Not started"}
            </span>
            <span className="text-xs text-slate-500">⏱ ~{node.estimatedMinutes} min · +{node.xpReward} XP</span>
          </div>
          <h1 className="text-3xl font-black text-white">{node.title}</h1>
          {node.description && <p className="text-slate-400">{node.description}</p>}
        </div>

        {/* Intro video */}
        {node.videoUrl && (
          <VideoBlockView
            block={{ id: "__intro", type: "video", url: node.videoUrl, caption: "Intro video" }}
            onRead={() => { }}
          />
        )}

        {/* Blocks */}
        {blocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
            {canEdit
              ? "No content yet — click Edit to add blocks."
              : "Content coming soon."}
          </div>
        ) : (
          <div className="space-y-8">
            {blocks.map((block) => {
              const saved = blockStates[block.id];

              if (block.type === "text") {
                return (
                  <TextBlockView
                    key={block.id}
                    block={block}
                    onRead={() => {
                      if (!saved || !["read", "correct", "checked", "ran"].includes(saved.state))
                        saveBlockProgress(block.id, "read");
                    }}
                  />
                );
              }

              if (block.type === "video") {
                return (
                  <VideoBlockView
                    key={block.id}
                    block={block}
                    onRead={() => {
                      if (!saved) saveBlockProgress(block.id, "read");
                    }}
                  />
                );
              }

              if (block.type === "quiz") {
                return (
                  <QuizBlockView
                    key={block.id}
                    block={block}
                    saved={saved}
                    onAnswer={(state, payload) => saveBlockProgress(block.id, state, payload)}
                  />
                );
              }

              if (block.type === "checklist") {
                return (
                  <ChecklistBlockView
                    key={block.id}
                    block={block}
                    saved={saved}
                    onCheck={(checked, allDone) => {
                      if (allDone) saveBlockProgress(block.id, "checked", { checked });
                      else setBlockStates((p) => ({ ...p, [block.id]: { blockId: block.id, state: "partial", payload: { checked } } }));
                    }}
                  />
                );
              }

              if (block.type === "code") {
                return (
                  <CodeBlockView
                    key={block.id}
                    block={block}
                    saved={saved}
                    onRun={(code) => saveBlockProgress(block.id, "ran", { code })}
                  />
                );
              }

              return null;
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {liveReadPct >= 100 && nodeStatus !== "verified" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
            <p className="text-lg font-bold text-white inline-flex items-center gap-2"><GraduationCap className="w-6 h-6" /> You've completed this module!</p>
            <p className="text-sm text-slate-400">
              Submit your evidence link below and a teacher, L5, or alumni will verify your skill and award you <strong className="text-emerald-400">+{node.xpReward} XP</strong>.
            </p>
            <EvidenceSubmit nodeId={node.id} existing={node.progress?.evidenceUrl ?? ""} />
          </div>
        )}

        {nodeStatus === "verified" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <p className="text-2xl">✦</p>
            <p className="text-lg font-bold text-emerald-300">Skill Verified!</p>
            <p className="text-sm text-slate-400 mt-1">
              Verified {node.progress?.verifiedAt ? new Date(node.progress.verifiedAt).toLocaleDateString() : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Evidence submit sub-component ───────────────────────────────────────────

function EvidenceSubmit({ nodeId, existing }: { nodeId: string; existing: string }) {
  const [url, setUrl] = useState(existing);
  const [sent, setSent] = useState(false);
  const [, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      await fetch("/api/passport/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, status: "done", evidenceUrl: url }),
      });
      setSent(true);
    });
  }

  if (sent) return <p className="text-sm text-emerald-400">⏳ Submitted — awaiting verification</p>;

  return (
    <div className="flex flex-col sm:flex-row gap-2 justify-center">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="GitHub / project link (optional)"
        className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none w-full sm:w-72"
      />
      <button
        onClick={submit}
        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition"
      >
        Submit for verification
      </button>
    </div>
  );
}
