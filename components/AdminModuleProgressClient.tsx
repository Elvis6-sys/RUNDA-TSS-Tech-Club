"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

type NodeMeta = { id: string; title: string; xpReward: number };
type Track = { id: string; name: string; icon: string | null; tier: string; nodes: NodeMeta[] };
type ProgressRecord = {
  id: string;
  userId: string;
  nodeId: string;
  status: string;
  readPct: number;
  evidenceUrl: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  user: { id: string; name: string | null; role: string; level: string | null };
  node: { id: string; title: string; trackId: string };
};

const STATUS_COLORS: Record<string, string> = {
  verified: "text-emerald-400",
  done: "text-sky-400",
  studying: "text-amber-400",
  not_started: "text-slate-500",
};

export default function AdminModuleProgressClient({
  tracks,
  progress,
}: {
  tracks: Track[];
  progress: ProgressRecord[];
}) {
  const [filter, setFilter] = useState<"all" | "done" | "studying" | "verified">("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [localProgress, setLocalProgress] = useState(progress);
  const [, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function verify(progressId: string) {
    startTransition(async () => {
      const res = await fetch("/api/passport/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId }),
      });
      if (res.ok) {
        setLocalProgress((prev) =>
          prev.map((p) => p.id === progressId ? { ...p, status: "verified", verifiedAt: new Date().toISOString() } : p)
        );
        showToast("✦ Skill verified — XP awarded");
      } else {
        showToast("Failed to verify");
      }
    });
  }

  const filtered = localProgress.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (trackFilter !== "all" && p.node.trackId !== trackFilter) return false;
    return true;
  });

  // Summary stats
  const doneCount = localProgress.filter((p) => p.status === "done").length;
  const verifiedCount = localProgress.filter((p) => p.status === "verified").length;
  const studyingCount = localProgress.filter((p) => p.status === "studying").length;

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-800 border border-slate-700 px-5 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Module Progress</h1>
          <p className="text-sm text-slate-400 mt-1">All students · all tracks</p>
        </div>
        <Link href="/passport" className="text-sm text-sky-400 hover:text-sky-300">
          → My lessons
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Awaiting verification", value: doneCount, color: "text-sky-400" },
          { label: "Verified skills", value: verifiedCount, color: "text-emerald-400" },
          { label: "Studying", value: studyingCount, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "done", "studying", "verified"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-2xl border px-4 py-1.5 text-sm font-medium transition ${filter === f
                ? "border-sky-500/60 bg-sky-500/15 text-sky-300"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
              }`}
          >
            {f === "all" ? "All" : f === "done" ? "⏳ Needs verification" : f === "studying" ? "◎ Studying" : "✦ Verified"}
          </button>
        ))}
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-1.5 text-sm text-slate-400 focus:border-sky-500 focus:outline-none"
        >
          <option value="all">All tracks</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Track</th>
              <th className="px-4 py-3">Read</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No records match the filter.</td>
              </tr>
            )}
            {filtered.map((p) => {
              const track = tracks.find((t) => t.id === p.node.trackId);
              return (
                <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{p.user.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{p.user.level ?? p.user.role}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/passport/module/${p.nodeId}`}
                      className="text-sky-400 hover:text-sky-300 hover:underline"
                    >
                      {p.node.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {track?.icon} {track?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all"
                          style={{ width: `${p.readPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{p.readPct}%</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${STATUS_COLORS[p.status] ?? "text-slate-400"}`}>
                    {p.status}
                  </td>
                  <td className="px-4 py-3">
                    {p.evidenceUrl ? (
                      <a
                        href={p.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        🔗 View
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "done" && (
                      <button
                        onClick={() => verify(p.id)}
                        className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                      >
                        ✦ Verify
                      </button>
                    )}
                    {p.status === "verified" && (
                      <span className="text-xs text-emerald-500">
                        {p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : "verified"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
