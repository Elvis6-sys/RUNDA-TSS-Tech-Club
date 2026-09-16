"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string | null;
  };
};

export default function StreakBadge({ streak }: Props) {
  const { t } = useTranslation();

  if (streak.current === 0) {
    return (
      <p className="text-xs text-slate-500 italic">
        {t("dashboard.streak_zero")}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
      <p className="text-sm font-semibold text-amber-300">
        {t("dashboard.streak_active", { days: streak.current })}
      </p>
      {streak.longest > streak.current && (
        <p className="shrink-0 text-[10px] text-slate-500">
          {t("dashboard.streak_longest", { days: streak.longest })}
        </p>
      )}
    </div>
  );
}
