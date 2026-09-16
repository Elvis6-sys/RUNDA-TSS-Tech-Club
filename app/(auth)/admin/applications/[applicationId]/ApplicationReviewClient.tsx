"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDepartmentName } from "@/lib/departments";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppData = {
  id: string;
  status: string;
  statement: string;
  taskLink: string | null;
  portfolioLink: string | null;
  reviewNotes: string | null;
  createdAt: string;
  rubric: Record<string, unknown>;
  department: string | null; // NEW
};

type ApplicantData = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  cohort: string | null;
  level: string | null;
  department: string | null; // NEW
  joinedAt: string;
};

// ─── Role options ─────────────────────────────────────────────────────────────

const ROLES = [
  { value: "l3", label: "L3 — Certificate III (entry level)" },
  { value: "l4", label: "L4 — Certificate IV (intermediate)" },
  { value: "l5", label: "L5 — Certificate V (advanced)" },
  { value: "alumni", label: "Alumni — programme graduate" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_review: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  const labels: Record<string, string> = {
    pending_review: "⏳ Pending Review",
    approved: "✅ Approved",
    rejected: "❌ Rejected",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${styles[status] ?? styles.pending_review}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ApplicationReviewClient({
  app,
  applicant,
  reviewerName,
}: {
  app: AppData;
  applicant: ApplicantData;
  reviewerName: string | null;
}) {
  const router = useRouter();
  const isPending = app.status === "pending_review";

  const [selectedRole, setSelectedRole] = useState<string>("l3");
  const [notes, setNotes] = useState<string>(app.reviewNotes ?? "");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"approve" | "reject" | null>(null);

  async function handleReview(action: "approve" | "reject") {
    setLoading(action);
    setError(null);

    const res = await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: app.id,
        action,
        role: action === "approve" ? selectedRole : undefined,
        reviewNotes: notes.trim() || null,
      }),
    });

    setLoading(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Please try again.");
      setConfirm(null);
      return;
    }

    // Success — go back to the list
    router.push("/admin/applications");
    router.refresh();
  }

  return (
    <div className="space-y-6">

      {/* ── Applicant info card ── */}
      <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shrink-0">
              {applicant.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{applicant.name ?? "Unknown"}</h2>
              <p className="text-sm text-slate-400">{applicant.email}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Registered {new Date(applicant.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <StatusBadge status={app.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Current role", value: applicant.role.replace("_", " ").toUpperCase() },
            { label: "Account status", value: applicant.status.replace("_", " ") },
            { label: "Applied", value: new Date(app.createdAt).toLocaleDateString("en-GB") },
            ...(applicant.cohort ? [{ label: "Cohort", value: applicant.cohort }] : []),
            ...(applicant.level ? [{ label: "Level", value: applicant.level }] : []),
            ...(app.department ? [{
              label: "Department",
              value: getDepartmentName(app.department),
              icon: (
                app.department === 'software-development' ? '💻' :
                  app.department === 'computer-systems-architecture' ? '🖥️' :
                    app.department === 'land-surveying' ? '📐' :
                      app.department === 'building-construction' ? '🏗️' : '🎓'
              )
            }] : []),
          ].map(item => (
            <div key={item.label} className="rounded-xl bg-slate-800/60 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{item.label}</p>
              <p className="text-sm font-semibold text-white mt-0.5 capitalize flex items-center gap-2">
                {('icon' in item) && <span className="text-lg">{item.icon}</span>}
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Personal statement ── */}
      <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Personal Statement</h3>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{app.statement}</p>
      </section>

      {/* ── Links ── */}
      {(app.taskLink || app.portfolioLink) && (
        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Submitted Links</h3>
          <div className="flex flex-wrap gap-3">
            {app.taskLink && (
              <a href={app.taskLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-300 hover:bg-sky-500/15 transition">
                🔗 Task Submission ↗
              </a>
            )}
            {app.portfolioLink && (
              <a href={app.portfolioLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/15 transition">
                💼 Portfolio ↗
              </a>
            )}
          </div>
        </section>
      )}

      {/* ── Rubric answers (if present) ── */}
      {app.rubric && Object.keys(app.rubric).length > 0 && (
        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Application Rubric</h3>
          <div className="space-y-3">
            {Object.entries(app.rubric).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-slate-800/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {typeof value === "string" ? value : JSON.stringify(value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Already reviewed notice ── */}
      {!isPending && (
        <div className={`rounded-3xl border p-6 space-y-2 ${app.status === "approved"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-rose-500/30 bg-rose-500/5"
          }`}>
          <p className="font-bold text-white">
            {app.status === "approved" ? "✅ Application Approved" : "❌ Application Rejected"}
          </p>
          {reviewerName && (
            <p className="text-xs text-slate-400">Reviewed by <span className="text-white">{reviewerName}</span></p>
          )}
          {app.reviewNotes && (
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{app.reviewNotes}</p>
          )}
        </div>
      )}

      {/* ── Review form (only when pending) ── */}
      {isPending && (
        <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-5">
          <h3 className="text-sm font-bold text-white">Make a Decision</h3>

          {/* Role selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Assign role on approval
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${selectedRole === r.value
                    ? "border-sky-500 bg-sky-500/15 text-sky-200 font-semibold"
                    : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                >
                  <span className={`w-3 h-3 rounded-full border-2 shrink-0 ${selectedRole === r.value ? "bg-sky-400 border-sky-400" : "border-slate-600"
                    }`} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Review notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Review notes <span className="text-slate-600 normal-case font-normal">(optional — shown to applicant on rejection)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add feedback for the applicant or internal notes…"
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </p>
          )}

          {/* Confirm step */}
          {confirm ? (
            <div className={`rounded-2xl border p-5 space-y-4 ${confirm === "approve"
              ? "border-emerald-500/40 bg-emerald-500/8"
              : "border-rose-500/40 bg-rose-500/8"
              }`}>
              <p className="font-semibold text-white">
                {confirm === "approve"
                  ? `Confirm: Approve ${applicant.name ?? "this applicant"} as ${selectedRole.toUpperCase()}?`
                  : `Confirm: Reject ${applicant.name ?? "this applicant"}'s application?`}
              </p>
              {confirm === "approve" && (
                <p className="text-xs text-slate-400">
                  Their account status will be set to <strong className="text-white">approved</strong> and role to <strong className="text-white">{selectedRole}</strong>. They will gain full access to the platform.
                </p>
              )}
              {confirm === "reject" && (
                <p className="text-xs text-slate-400">
                  Their account status will be set to <strong className="text-white">rejected</strong>.
                  {notes.trim() && " Your review notes will be visible to them."}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleReview(confirm)}
                  disabled={loading !== null}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition disabled:opacity-50 ${confirm === "approve"
                    ? "bg-emerald-500 text-white hover:bg-emerald-400"
                    : "bg-rose-500 text-white hover:bg-rose-400"
                    }`}
                >
                  {loading ? "Processing…" : `Yes, ${confirm}`}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  disabled={loading !== null}
                  className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirm("approve")}
                className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-400 transition shadow-lg shadow-emerald-900/30"
              >
                ✅ Approve as {selectedRole.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={() => setConfirm("reject")}
                className="flex-1 rounded-2xl border border-rose-500/50 bg-rose-500/10 py-3 text-sm font-bold text-rose-300 hover:bg-rose-500/20 transition"
              >
                ❌ Reject
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
