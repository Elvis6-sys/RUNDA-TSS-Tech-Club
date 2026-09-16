"use client";

import { useState, useTransition } from "react";

type QueueItem = {
  id: string;
  status: string;
  evidenceUrl: string | null;
  updatedAt: string;
  verifiedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    level: string | null;
    cohort: string | null;
  };
  node: {
    id: string;
    title: string;
    xpReward: number;
    track: { name: string; icon: string | null };
  };
};

const ROLE_COLORS: Record<string, string> = {
  l3: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  l4: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  l5: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  alumni: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

export default function VerifyQueueClient({
  initialQueue,
  verifierName,
}: {
  initialQueue: QueueItem[];
  verifierName: string;
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [verifying, setVerifying] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [, startTransition] = useTransition();

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function verify(progressId: string, studentName: string, skillTitle: string) {
    setVerifying((s) => new Set(s).add(progressId));
    startTransition(async () => {
      const res = await fetch("/api/passport/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressId }),
      });
      if (res.ok) {
        setQueue((q) => q.filter((item) => item.id !== progressId));
        showToast(`✦ Verified "${skillTitle}" for ${studentName ?? "student"}`);
      } else {
        const err = await res.json();
        showToast(err.error ?? "Verification failed", false);
      }
      setVerifying((s) => { const n = new Set(s); n.delete(progressId); return n; });
    });
  }

  // Group by student
  const byStudent = queue.reduce<Record<string, { user: QueueItem["user"]; items: QueueItem[] }>>(
    (acc, item) => {
      if (!acc[item.user.id]) acc[item.user.id] = { user: item.user, items: [] };
      acc[item.user.id].items.push(item);
      return acc;
    },
    {}
  );

  const studentGroups = Object.values(byStudent);

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-5 py-3 text-sm shadow-xl
          ${toast.ok
            ? "bg-slate-800 border-emerald-500/40 text-emerald-300"
            : "bg-slate-800 border-rose-500/40 text-rose-300"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Verification Queue</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Skill Reviews</h1>
          <p className="mt-1 text-sm text-slate-400">
            Students who marked skills as done and are awaiting your verification.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-center">
          <p className="text-2xl font-bold text-white">{queue.length}</p>
          <p className="text-xs text-slate-500">pending</p>
        </div>
      </div>

      {/* Empty state */}
      {studentGroups.length === 0 && (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">✦</span>
          <p className="text-lg font-semibold text-white">All caught up</p>
          <p className="text-sm text-slate-400">No skills are waiting for verification right now.</p>
        </div>
      )}

      {/* Student groups */}
      {studentGroups.map(({ user, items }) => (
        <section key={user.id} className="card space-y-4">
          {/* Student header */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-base font-bold text-white">
              {(user.name ?? user.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{user.name ?? user.email}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                {user.role.toUpperCase()}
              </span>
              {user.level && (
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                  {user.level}
                </span>
              )}
              {user.cohort && (
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                  Cohort {user.cohort}
                </span>
              )}
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs text-slate-500">
                {items.length} skill{items.length !== 1 ? "s" : ""} pending
              </span>
            </div>
          </div>

          {/* Skill items */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 flex-wrap"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">{item.node.track.icon ?? "📌"}</span>
                    <p className="font-medium text-white">{item.node.title}</p>
                    <span className="text-xs text-slate-500">{item.node.track.name}</span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                      +{item.node.xpReward} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Submitted {new Date(item.updatedAt).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {item.evidenceUrl && (
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition"
                    >
                      🔗 View evidence
                    </a>
                  )}
                  {!item.evidenceUrl && (
                    <p className="text-xs text-slate-600 italic">No evidence link provided</p>
                  )}
                </div>

                <button
                  disabled={verifying.has(item.id)}
                  onClick={() => verify(item.id, user.name ?? user.email, item.node.title)}
                  className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying.has(item.id) ? "Verifying…" : "✦ Verify"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
