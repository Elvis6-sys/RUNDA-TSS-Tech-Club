"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export default function SignOutButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setError(null);
    setLoading(true);

    try {
      // ── Electron: use IPC signout (clears cookies + navigates) ──────────
      if (typeof window !== 'undefined' && window.isElectron && window.electronAPI?.signout) {
        await window.electronAPI.signout();
        // Electron main process handles cookie clearing + navigation itself.
        // Nothing more to do here — the window will reload to /auth/login.
        return;
      }

      // ── Browser: call Next.js signout API then redirect ─────────────────
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) {
        setError("Unable to sign out. Please try again.");
        return;
      }
      router.replace("/auth/login");
      router.refresh();
    } catch (err) {
      setError("Sign out failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (fullWidth) {
    return (
      <div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition disabled:opacity-60"
        >
          {loading
            ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
            : <LogOut className="w-4 h-4 shrink-0" />
          }
          <span>{loading ? "Signing out…" : "Sign out"}</span>
        </button>
        {error && <p className="text-xs text-rose-400 px-4 pb-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className="inline-flex items-center gap-2 justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <LogOut className="w-3.5 h-3.5" />
        }
        {loading ? "Signing out…" : "Sign out"}
      </button>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
