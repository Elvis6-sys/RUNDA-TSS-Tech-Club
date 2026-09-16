"use client";

/**
 * StudentQuizResults — navigation link to /passport/my-results
 * Replaced modal with a dedicated full page to avoid z-index issues with the sidebar.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentQuizResults() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Lightweight count check — just the graded submissions count
    fetch("/api/quiz/my-results")
      .then(r => r.json())
      .then(d => setCount((d.submissions ?? []).length))
      .catch(() => { });
  }, []);

  return (
    <Link
      href="/passport/my-results"
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/40 hover:bg-slate-900/70 text-sm text-slate-300 transition group">
      <span className="text-base">📊</span>
      <span className="font-medium hidden sm:inline">My Results</span>
      {count > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {count}
        </span>
      )}
    </Link>
  );
}
