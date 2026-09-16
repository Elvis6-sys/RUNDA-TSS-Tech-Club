"use client";

import { useState, useTransition, useEffect } from "react";
import { Trophy, Moon, Sun, Target, Award, Clock } from "lucide-react";

type MySubmission = {
  id: string;
  score: number | null;
  submissionUrl: string;
  note: string | null;
  scoredAt: string | null;
} | null;

type Challenge = {
  id: string;
  title: string;
  description: string;
  tier: string;
  xpReward: number;
  dueDate: string;
  status: string;
  submissionCount: number;
  mySubmission: MySubmission;
};

/* ── Hero images ────────────────────────────────────────────── */
const HERO_IMAGES = [
  "/images/student-focused.jpg",
  "/images/students-group.jpg",
  "/images/students-learning.jpg",
];

const TIER_LABELS: Record<string, string> = { l3: "L3", l4: "L4", l5: "L5", all: "All" };
const TIER_COLORS: Record<string, string> = {
  l3: "bg-sky-500/20 text-sky-400 border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  l4: "bg-violet-500/20 text-violet-400 border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
  l5: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  all: "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600",
};

const SCORE_LABELS: Record<number, string> = {
  1: "Needs work",
  2: "Developing",
  3: "Solid",
  4: "Strong",
  5: "Exceptional",
};

function daysLeft(dueDate: string) {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: "Closed", urgent: false, past: true };
  if (diff === 0) return { label: "Due today", urgent: true, past: false };
  if (diff === 1) return { label: "1 day left", urgent: true, past: false };
  return { label: `${diff} days left`, urgent: diff <= 3, past: false };
}

export default function ChallengesClient({
  challenges,
  canCreate,
  canScore,
  userId,
}: {
  challenges: Challenge[];
  canCreate: boolean;
  canScore: boolean;
  userId: string;
}) {
  const [items, setItems] = useState(challenges);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState<Record<string, string>>({});
  const [submitNote, setSubmitNote] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Load theme from localStorage
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

  // Create form state
  const [form, setForm] = useState({ title: "", description: "", tier: "all", xpReward: "30", dueDate: "" });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function submit(challengeId: string) {
    const url = submitUrl[challengeId]?.trim();
    if (!url) return;
    startTransition(async () => {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionUrl: url, note: submitNote[challengeId] ?? null }),
      });
      if (res.ok) {
        const sub = await res.json();
        setItems((prev) => prev.map((c) =>
          c.id === challengeId
            ? { ...c, mySubmission: { id: sub.id, score: null, submissionUrl: url, note: sub.note, scoredAt: null }, submissionCount: c.submissionCount + (c.mySubmission ? 0 : 1) }
            : c
        ));
        showToast("Submission saved");
      } else {
        const e = await res.json();
        showToast(e.error ?? "Failed to submit");
      }
    });
  }

  async function score(challengeId: string, submissionId: string, scoreVal: number) {
    startTransition(async () => {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, score: scoreVal }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((c) =>
          c.id === challengeId && c.mySubmission?.id === submissionId
            ? { ...c, mySubmission: { ...c.mySubmission!, score: scoreVal, scoredAt: new Date().toISOString() } }
            : c
        ));
        showToast(`Scored! +${data.xpAwarded} Points awarded`);
      }
    });
  }

  async function createChallenge() {
    if (!form.title || !form.description || !form.dueDate) return;
    startTransition(async () => {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, xpReward: parseInt(form.xpReward) }),
      });
      if (res.ok) {
        const c = await res.json();
        setItems((prev) => [{
          ...c,
          dueDate: c.dueDate,
          createdAt: c.createdAt,
          mySubmission: null,
          submissionCount: 0,
        }, ...prev]);
        setForm({ title: "", description: "", tier: "all", xpReward: "30", dueDate: "" });
        setShowCreate(false);
        showToast("Challenge posted");
      }
    });
  }

  const open = items.filter((c) => c.status === "open");
  const closed = items.filter((c) => c.status === "closed");

  // Theme-dependent styles
  const isDark = theme === "dark";
  const currentStyles = isDark ? {
    bg: "bg-slate-950",
    mainText: "text-white",
    subText: "text-slate-400",
    card: "bg-slate-900/50 border-slate-800/50",
    cardHover: "hover:bg-slate-900/70 hover:border-slate-700",
    input: "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500",
    button: "border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
    createButton: "border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20",
    gradient: "from-slate-950/95 via-slate-950/90 to-slate-950/80",
  } : {
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

  return (
    <div className={`min-h-screen ${currentStyles.bg} transition-colors duration-300`}>
      {/* Hero Section with Background Image */}
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
                  <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                    <Trophy className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className={`text-xs uppercase tracking-[0.3em] ${currentStyles.subText}`}>Weekly</p>
                </div>
                <h1 className={`text-4xl font-bold ${currentStyles.mainText} mb-2`}>Challenges</h1>
                <p className={`text-sm ${currentStyles.subText}`}>
                  Submit your work, get scored, earn Points.
                </p>
              </div>
              {canCreate && (
                <button
                  onClick={() => setShowCreate((v) => !v)}
                  className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition backdrop-blur-sm ${currentStyles.createButton}`}
                >
                  {showCreate ? "Cancel" : "+ Post challenge"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-5 py-3 text-sm shadow-xl backdrop-blur-sm ${isDark
            ? "border-slate-700 bg-slate-800/90 text-white"
            : "border-slate-300 bg-white/90 text-slate-900"
            }`}>
            {toast}
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`fixed top-20 right-6 z-50 p-2 rounded-xl border transition backdrop-blur-sm ${isDark
            ? "bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700"
            : "bg-white/90 border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Create form */}
        {showCreate && (
          <section className={`rounded-2xl border p-6 space-y-4 backdrop-blur-sm ${currentStyles.card}`}>
            <h2 className={`font-semibold ${currentStyles.mainText}`}>New challenge</h2>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition ${currentStyles.input}`}
            />
            <textarea
              placeholder="Description — what should students build or solve?"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none resize-none transition ${currentStyles.input}`}
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={form.tier}
                onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                className={`rounded-xl border px-3 py-2 text-sm focus:outline-none transition ${currentStyles.input}`}
              >
                {["all", "l3", "l4", "l5"].map((t) => (
                  <option key={t} value={t}>{TIER_LABELS[t]} — {t === "all" ? "Everyone" : `Level ${t.toUpperCase()} and above`}</option>
                ))}
              </select>
              <input
                type="number"
                min={5}
                max={100}
                placeholder="Points reward"
                value={form.xpReward}
                onChange={(e) => setForm((f) => ({ ...f, xpReward: e.target.value }))}
                className={`w-28 rounded-xl border px-3 py-2 text-sm focus:outline-none transition ${currentStyles.input}`}
              />
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className={`rounded-xl border px-3 py-2 text-sm focus:outline-none transition ${currentStyles.input}`}
              />
            </div>
            <button
              disabled={isPending || !form.title || !form.description || !form.dueDate}
              onClick={createChallenge}
              className={`rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2 text-sm font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50 ${isDark ? "text-emerald-300" : "text-emerald-600"
                }`}
            >
              Post challenge
            </button>
          </section>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className={`rounded-2xl border flex flex-col items-center gap-3 py-16 text-center backdrop-blur-sm ${currentStyles.card}`}>
            <Trophy className="w-12 h-12 text-blue-400" />
            <p className={`text-lg font-semibold ${currentStyles.mainText}`}>No challenges yet</p>
            <p className={`text-sm ${currentStyles.subText}`}>Check back on Monday — a new challenge drops every week.</p>
          </div>
        )}

        {/* Open challenges */}
        {open.length > 0 && (
          <div className="space-y-4">
            <p className={`text-xs uppercase tracking-widest ${currentStyles.subText}`}>Open</p>
            {open.map((c) => <ChallengeCard key={c.id} c={c} expanded={expanded} setExpanded={setExpanded} submitUrl={submitUrl} setSubmitUrl={setSubmitUrl} submitNote={submitNote} setSubmitNote={setSubmitNote} onSubmit={submit} onScore={score} canScore={canScore} isPending={isPending} isDark={isDark} currentStyles={currentStyles} />)}
          </div>
        )}

        {/* Closed challenges */}
        {closed.length > 0 && (
          <div className="space-y-4">
            <p className={`text-xs uppercase tracking-widest ${currentStyles.subText}`}>Closed</p>
            {closed.map((c) => <ChallengeCard key={c.id} c={c} expanded={expanded} setExpanded={setExpanded} submitUrl={submitUrl} setSubmitUrl={setSubmitUrl} submitNote={submitNote} setSubmitNote={setSubmitNote} onSubmit={submit} onScore={score} canScore={canScore} isPending={isPending} isDark={isDark} currentStyles={currentStyles} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({
  c, expanded, setExpanded, submitUrl, setSubmitUrl, submitNote, setSubmitNote, onSubmit, onScore, canScore, isPending, isDark, currentStyles,
}: {
  c: Challenge;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  submitUrl: Record<string, string>;
  setSubmitUrl: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submitNote: Record<string, string>;
  setSubmitNote: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onSubmit: (id: string) => void;
  onScore: (challengeId: string, submissionId: string, score: number) => void;
  canScore: boolean;
  isPending: boolean;
  isDark: boolean;
  currentStyles: any;
}) {
  const due = daysLeft(c.dueDate);
  const isOpen = expanded === c.id;
  const sub = c.mySubmission;

  return (
    <div className={`rounded-2xl border p-6 backdrop-blur-sm transition ${currentStyles.card} ${currentStyles.cardHover} ${c.status === "closed" ? "opacity-60" : ""}`}>
      {/* Card header — always visible */}
      <button
        className="w-full text-left"
        onClick={() => setExpanded(isOpen ? null : c.id)}
      >
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TIER_COLORS[c.tier]}`}>
                {TIER_LABELS[c.tier]}
              </span>
              {sub?.score !== null && sub?.score !== undefined && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${isDark
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-emerald-500/40 bg-emerald-500/20 text-emerald-600"
                  }`}>
                  Score {sub.score}/5 — {SCORE_LABELS[sub.score]}
                </span>
              )}
              {sub && sub.score === null && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs ${isDark
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                  : "border-amber-500/40 bg-amber-500/20 text-amber-600"
                  }`}>
                  ⏳ Awaiting score
                </span>
              )}
            </div>
            <p className={`font-semibold ${currentStyles.mainText}`}>{c.title}</p>
          </div>
          <div className="shrink-0 text-right space-y-1">
            <p className={`text-xs font-semibold ${due.past ? currentStyles.subText : due.urgent ? (isDark ? "text-rose-400" : "text-rose-500") : currentStyles.subText}`}>
              {due.label}
            </p>
            <p className={`text-xs ${currentStyles.subText} opacity-60`}>{c.submissionCount} submission{c.submissionCount !== 1 ? "s" : ""}</p>
            <p className={`text-xs font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>+{c.xpReward} Points</p>
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="mt-4 space-y-4 border-t pt-4" style={{ borderColor: isDark ? "rgba(51, 65, 85, 0.5)" : "rgba(226, 232, 240, 0.8)" }}>
          <p className={`text-sm ${currentStyles.subText} whitespace-pre-wrap`}>{c.description}</p>

          {/* Already submitted */}
          {sub && (
            <div className={`rounded-2xl border p-4 space-y-2 ${isDark
              ? "border-slate-700 bg-slate-800/60"
              : "border-slate-300 bg-slate-100/60"
              }`}>
              <p className={`text-xs font-semibold uppercase tracking-widest ${currentStyles.subText}`}>Your submission</p>
              <a href={sub.submissionUrl} target="_blank" rel="noopener noreferrer"
                className={`text-sm break-all ${isDark ? "text-sky-400 hover:text-sky-300" : "text-sky-600 hover:text-sky-700"}`}>
                🔗 {sub.submissionUrl}
              </a>
              {sub.note && <p className={`text-xs ${currentStyles.subText}`}>{sub.note}</p>}
              {sub.score !== null && sub.score !== undefined ? (
                <div className="flex items-center gap-2 pt-1">
                  <ScoreStars score={sub.score} />
                  <span className={`text-sm font-semibold ${currentStyles.mainText}`}>{sub.score}/5</span>
                  <span className={`text-sm ${currentStyles.subText}`}>— {SCORE_LABELS[sub.score]}</span>
                </div>
              ) : (
                <>
                  <p className={`text-xs ${currentStyles.subText}`}>⏳ Not yet scored</p>
                  {/* Scorer panel — shown to verifiers even on their own submission view */}
                  {canScore && (
                    <ScorePanel challengeId={c.id} submissionId={sub.id} onScore={onScore} isPending={isPending} isDark={isDark} currentStyles={currentStyles} />
                  )}
                </>
              )}
            </div>
          )}

          {/* Submit form — open challenge, not yet submitted */}
          {!sub && c.status === "open" && (
            <div className="space-y-3">
              <input
                type="url"
                placeholder="Submission URL (GitHub repo, deployed link…)"
                value={submitUrl[c.id] ?? ""}
                onChange={(e) => setSubmitUrl((p) => ({ ...p, [c.id]: e.target.value }))}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition ${currentStyles.input}`}
              />
              <textarea
                placeholder="Short note (optional) — what did you build?"
                rows={2}
                value={submitNote[c.id] ?? ""}
                onChange={(e) => setSubmitNote((p) => ({ ...p, [c.id]: e.target.value }))}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none resize-none transition ${currentStyles.input}`}
              />
              <button
                disabled={isPending || !submitUrl[c.id]?.trim()}
                onClick={() => onSubmit(c.id)}
                className={`rounded-xl border px-5 py-2 text-sm font-semibold transition disabled:opacity-50 ${currentStyles.button}`}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-base ${s <= score ? "text-amber-400" : "text-slate-400 dark:text-slate-700"}`}>★</span>
      ))}
    </div>
  );
}

function ScorePanel({ challengeId, submissionId, onScore, isPending, isDark, currentStyles }: {
  challengeId: string;
  submissionId: string;
  onScore: (cId: string, sId: string, score: number) => void;
  isPending: boolean;
  isDark: boolean;
  currentStyles: any;
}) {
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(0);

  return (
    <div className="pt-2 space-y-2">
      <p className={`text-xs uppercase tracking-widest ${currentStyles.subText}`}>Score this submission</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setSelected(s)}
            className={`text-2xl transition ${s <= (hover || selected) ? "text-amber-400" : (isDark ? "text-slate-700" : "text-slate-300")}`}
          >
            ★
          </button>
        ))}
        {(hover || selected) > 0 && (
          <span className={`ml-2 text-xs ${currentStyles.subText}`}>{SCORE_LABELS[hover || selected]}</span>
        )}
      </div>
      {selected > 0 && (
        <button
          disabled={isPending}
          onClick={() => onScore(challengeId, submissionId, selected)}
          className={`rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold hover:bg-emerald-500/20 transition disabled:opacity-50 ${isDark ? "text-emerald-300" : "text-emerald-600"
            }`}
        >
          Confirm score
        </button>
      )}
    </div>
  );
}
