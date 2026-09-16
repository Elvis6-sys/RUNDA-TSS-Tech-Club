"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function StartupCheckPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("Checking server...");
  const [checks, setChecks] = useState<Record<string, boolean>>({
    server: false,
    database: false,
    auth: false,
  });

  useEffect(() => {
    async function runChecks() {
      // Check 1: Server responding
      try {
        setStatus("Checking server connection...");
        const serverCheck = await fetch("/api/health");
        if (serverCheck.ok) {
          setChecks((prev) => ({ ...prev, server: true }));
        }
      } catch {
        setStatus("Server check failed - retrying...");
        await new Promise((r) => setTimeout(r, 1000));
        window.location.reload();
        return;
      }

      // Check 2: Database
      try {
        setStatus("Checking database connection...");
        const dbCheck = await fetch("/api/health/db");
        if (dbCheck.ok) {
          setChecks((prev) => ({ ...prev, database: true }));
        }
      } catch {
        setStatus("Database not ready - retrying...");
        await new Promise((r) => setTimeout(r, 1000));
        window.location.reload();
        return;
      }

      // Check 3: Auth (Supabase)
      try {
        setStatus("Checking authentication service...");
        const authCheck = await fetch("/api/health/auth");
        if (authCheck.ok) {
          setChecks((prev) => ({ ...prev, auth: true }));
        }
      } catch {
        setStatus("Auth service not ready - retrying...");
        await new Promise((r) => setTimeout(r, 1000));
        window.location.reload();
        return;
      }

      // All checks passed!
      setStatus("All systems ready! Redirecting...");
      await new Promise((r) => setTimeout(r, 500));
      router.push("/");
    }

    runChecks();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">RUNDA TSS Tech Club</h1>
          <p className="text-blue-200">{status}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className={`flex items-center justify-center gap-2 ${checks.server ? "text-green-400" : "text-gray-400"}`}>
            {checks.server ? "✓" : "○"} Server
          </div>
          <div className={`flex items-center justify-center gap-2 ${checks.database ? "text-green-400" : "text-gray-400"}`}>
            {checks.database ? "✓" : "○"} Database
          </div>
          <div className={`flex items-center justify-center gap-2 ${checks.auth ? "text-green-400" : "text-gray-400"}`}>
            {checks.auth ? "✓" : "○"} Authentication
          </div>
        </div>
      </div>
    </div>
  );
}
