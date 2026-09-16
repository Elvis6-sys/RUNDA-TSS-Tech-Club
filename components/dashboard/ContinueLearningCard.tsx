"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  lesson: {
    lessonId: string;
    title: string;
    subject: string;
    completedAt: string | null;
    lastReadAt: string;
  } | null;
};

const SUBJECT_ACCENT: Record<string, string> = {
  "Blockchain Fundamentals": "from-sky-500/20 to-indigo-500/10 border-sky-500/30",
  "Python":                  "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
  "Mathematics":             "from-amber-500/20 to-orange-500/10 border-amber-500/30",
  "Web Development":         "from-purple-500/20 to-violet-500/10 border-purple-500/30",
};

function accent(subject: string) {
  return SUBJECT_ACCENT[subject] ?? "from-slate-700/40 to-slate-800/20 border-slate-700/40";
}

export default function ContinueLearningCard({ lesson }: Props) {
  const { t } = useTranslation();

  if (!lesson) {
    return (
      <div className="rounded-3xl border border-slate-700/50 bg-slate-800/40 px-6 py-8 text-center">
        <p className="text-sm text-slate-400">{t("dashboard.no_lesson_yet")}</p>
        <Link
          href="/lessons"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 transition"
        >
          {t("dashboard.browse_lessons")} →
        </Link>
      </div>
    );
  }

  const isCompleted = !!lesson.completedAt;

  return (
    <Link
      href={`/lessons`}
      className={`group block rounded-3xl border bg-gradient-to-br ${accent(lesson.subject)} px-6 py-6 transition hover:brightness-110`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {isCompleted ? "✓ Completed" : t("dashboard.continue_learning")}
          </p>
          <h2 className="text-lg font-bold text-white leading-snug truncate">
            {lesson.title}
          </h2>
          <p className="mt-1 text-xs text-slate-400">{lesson.subject}</p>
        </div>
        <span className="shrink-0 mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xl group-hover:bg-white/20 transition">
          {isCompleted ? "✓" : "▶"}
        </span>
      </div>
    </Link>
  );
}
