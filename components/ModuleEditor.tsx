"use client";

import { useState, useTransition } from "react";

type BlockType = "text" | "quiz" | "checklist" | "code" | "video";

type Block =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "code"; language: string; starter: string; solution?: string; hint?: string }
  | { id: string; type: "quiz"; question: string; options: string[]; correct: number; explanation?: string }
  | { id: string; type: "checklist"; items: string[] };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultBlock(type: BlockType): Block {
  if (type === "text") return { id: uid(), type, content: "" };
  if (type === "video") return { id: uid(), type, url: "", caption: "" };
  if (type === "code") return { id: uid(), type, language: "javascript", starter: "// write your code here\n", solution: "", hint: "" };
  if (type === "quiz") return { id: uid(), type, question: "", options: ["", "", "", ""], correct: 0, explanation: "" };
  return { id: uid(), type: "checklist", items: [""] };
}

export default function ModuleEditor({
  nodeId,
  initialBlocks,
  estimatedMinutes,
  videoUrl,
  description,
  onSaved,
}: {
  nodeId: string;
  initialBlocks: unknown[];
  estimatedMinutes: number;
  videoUrl?: string | null;
  description?: string | null;
  onSaved?: () => void;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks as Block[]);
  const [meta, setMeta] = useState({ estimatedMinutes, videoUrl: videoUrl ?? "", description: description ?? "" });
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function addBlock(type: BlockType) {
    setBlocks((b) => [...b, defaultBlock(type)]);
  }

  function removeBlock(id: string) {
    setBlocks((b) => b.filter((bl) => bl.id !== id));
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    setBlocks((b) => b.map((bl) => (bl.id === id ? ({ ...bl, ...patch } as Block) : bl)));
  }

  // Drag-and-drop reorder
  function onDragStart(idx: number) { setDragIdx(idx); }
  function onDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) return;
    setBlocks((b) => {
      const arr = [...b];
      const [item] = arr.splice(dragIdx, 1);
      arr.splice(idx, 0, item);
      return arr;
    });
    setDragIdx(null);
  }

  function save() {
    startTransition(async () => {
      const res = await fetch(`/api/modules/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks,
          estimatedMinutes: meta.estimatedMinutes,
          videoUrl: meta.videoUrl || null,
          description: meta.description || null,
        }),
      });
      if (res.ok) { showToast("Module saved ✓"); onSaved?.(); }
      else showToast("Save failed — try again");
    });
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-800 border border-slate-700 px-5 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Meta */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Module Settings</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Description</label>
            <textarea
              rows={2}
              value={meta.description}
              onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">Estimated minutes</label>
              <input
                type="number"
                min={1}
                value={meta.estimatedMinutes}
                onChange={(e) => setMeta((m) => ({ ...m, estimatedMinutes: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Intro video URL (optional)</label>
              <input
                type="url"
                value={meta.videoUrl}
                onChange={(e) => setMeta((m) => ({ ...m, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(idx)}
            className={`card border-2 transition ${dragIdx === idx ? "border-sky-500/60 opacity-50" : "border-slate-700/50"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="cursor-grab text-slate-600 select-none">⠿</span>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-400 uppercase">
                {block.type}
              </span>
              <span className="text-xs text-slate-600">#{idx + 1}</span>
              <button
                onClick={() => removeBlock(block.id)}
                className="ml-auto text-xs text-red-400 hover:text-red-300"
              >
                ✕ Remove
              </button>
            </div>

            {block.type === "text" && (
              <textarea
                rows={5}
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Write markdown content here…"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none font-mono"
              />
            )}

            {block.type === "video" && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={block.url}
                  onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                  placeholder="YouTube or video URL"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={block.caption ?? ""}
                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>
            )}

            {block.type === "code" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={block.language}
                    onChange={(e) => updateBlock(block.id, { language: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                  >
                    {["javascript", "python", "html", "css", "sql", "bash"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  rows={4}
                  value={block.starter}
                  onChange={(e) => updateBlock(block.id, { starter: e.target.value })}
                  placeholder="Starter code…"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none font-mono"
                />
                <textarea
                  rows={3}
                  value={block.solution ?? ""}
                  onChange={(e) => updateBlock(block.id, { solution: e.target.value })}
                  placeholder="Solution (shown after attempt)"
                  className="w-full rounded-xl border border-emerald-800/40 bg-emerald-900/10 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                />
                <input
                  type="text"
                  value={block.hint ?? ""}
                  onChange={(e) => updateBlock(block.id, { hint: e.target.value })}
                  placeholder="Hint (optional)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>
            )}

            {block.type === "quiz" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={block.question}
                  onChange={(e) => updateBlock(block.id, { question: e.target.value })}
                  placeholder="Question"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                />
                {block.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${block.id}`}
                      checked={block.correct === oi}
                      onChange={() => updateBlock(block.id, { correct: oi })}
                      className="accent-emerald-400"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const opts = [...block.options];
                        opts[oi] = e.target.value;
                        updateBlock(block.id, { options: opts });
                      }}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-500">● = correct answer</p>
                <input
                  type="text"
                  value={block.explanation ?? ""}
                  onChange={(e) => updateBlock(block.id, { explanation: e.target.value })}
                  placeholder="Explanation shown after answer"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>
            )}

            {block.type === "checklist" && (
              <div className="space-y-2">
                {block.items.map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const items = [...block.items];
                        items[ii] = e.target.value;
                        updateBlock(block.id, { items });
                      }}
                      placeholder={`Task ${ii + 1}`}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      onClick={() => updateBlock(block.id, { items: block.items.filter((_, i) => i !== ii) })}
                      className="text-xs text-red-400 hover:text-red-300"
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={() => updateBlock(block.id, { items: [...block.items, ""] })}
                  className="text-xs text-sky-400 hover:text-sky-300"
                >+ Add item</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2">
        {(["text", "video", "quiz", "code", "checklist"] as BlockType[]).map((t) => (
          <button
            key={t}
            onClick={() => addBlock(t)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-sky-500/50 hover:text-sky-300 transition"
          >
            + {t}
          </button>
        ))}
      </div>

      <button
        disabled={isPending}
        onClick={save}
        className="rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition"
      >
        {isPending ? "Saving…" : "Save Module"}
      </button>
    </div>
  );
}
