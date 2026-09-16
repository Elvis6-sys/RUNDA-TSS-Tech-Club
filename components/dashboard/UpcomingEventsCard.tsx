"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { format } from "date-fns";

type Event = { id: string; title: string; date: string; type: string };

const TYPE_COLOR: Record<string, string> = {
  holiday_intensive: "bg-sky-500/20 text-sky-300",
  demo_day:          "bg-emerald-500/20 text-emerald-300",
  mentorship:        "bg-purple-500/20 text-purple-300",
  other:             "bg-slate-700 text-slate-400",
};

export default function UpcomingEventsCard({ events }: { events: Event[] }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 py-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {t("dashboard.upcoming_events")}
      </p>
      {events.length === 0 ? (
        <p className="text-xs text-slate-600">{t("dashboard.no_events")}</p>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center gap-3">
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLOR[ev.type] ?? TYPE_COLOR.other}`}>
                {format(new Date(ev.date), "MMM d")}
              </span>
              <span className="truncate text-sm text-slate-300">{ev.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
