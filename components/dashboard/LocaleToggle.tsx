"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

export default function LocaleToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "rw" : "en")}
      className="rounded-xl border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-white hover:border-slate-600 transition"
      title={locale === "en" ? "Switch to Kinyarwanda" : "Switch to English"}
    >
      {locale === "en" ? "RW" : "EN"}
    </button>
  );
}
