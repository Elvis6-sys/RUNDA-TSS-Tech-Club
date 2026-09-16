"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  summary: {
    subject: string;
    total: number;
    completed: number;
    pct: number;
    remaining: number;
  } | null;
};

export default function ProgressSummary({ summary }: Props) {
  const { t } = useTranslation();

  if (!summary) return null;

  const label = t("dashboard.progress_summary", {
    pct: summary.pct,
    subject: summary.subject,
    remaining: summary.remaining,
  });

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 py-4">
      <p className="mb-3 text-sm text-slate-300 leading-relaxed">{label}</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-700"
          style={{ width: `${summary.pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
        <span>{summary.completed} completed</span>
        <span>{summary.total} total</span>
      </div>
    </div>
  );
}
