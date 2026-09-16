"use client";

import { useEffect, useState } from "react";

/**
 * Visual indicator showing whether the app is running in Tauri secure browser
 * Useful for debugging and confirming environment detection
 */
export function TauriModeIndicator() {
  const [isInTauri, setIsInTauri] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsInTauri(typeof window !== 'undefined' && '__TAURI__' in window);
  }, []);

  if (!mounted) return null;

  if (!isInTauri) return null; // Only show in Tauri mode

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-lg border border-emerald-400/30">
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-200"></span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold">🔒 Secure Mode</span>
        <span className="text-[10px] opacity-80">Auto-submit disabled</span>
      </div>
    </div>
  );
}
