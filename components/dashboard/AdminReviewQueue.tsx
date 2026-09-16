"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Application = {
  user: { id: string; name: string | null; email: string; role: string; school: string | null };
};

type Stats = {
  pendingCount: number;
  totalMembers: number;
  lessonsCompleted: number;
  pendingApplications: Application[];
};

export default function AdminReviewQueue({ stats }: { stats: Stats }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t("admin.total_members"),     value: stats.totalMembers },
          { label: t("admin.active_this_week"),  value: "—" },
          { label: t("admin.lessons_completed"), value: stats.lessonsCompleted },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-700/50 bg-slate-800/40 px-3 py-3 text-center">
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending queue */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-amber-400">
          {t("admin.pending_applications")} ({stats.pendingCount})
        </p>
        {stats.pendingApplications.length === 0 ? (
          <p className="text-xs text-slate-600">{t("admin.no_pending")}</p>
        ) : (
          <ul className="space-y-2">
            {stats.pendingApplications.map((app) => (
              <li key={app.user.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {app.user.name ?? app.user.email}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {app.user.school ?? "—"}
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                >
                  {t("admin.review")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
