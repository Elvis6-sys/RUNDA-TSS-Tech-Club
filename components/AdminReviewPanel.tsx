"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Application = {
  id: string;
  rubric: Record<string, string>;
  statement: string;
  taskLink: string | null;
  portfolioLink: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    school: string | null;
    cohort: string | null;
  };
};

export default function AdminReviewPanel({ pendingApplications }: { pendingApplications: Application[] }) {
  const router = useRouter();
  const [reviewStates, setReviewStates] = useState<Record<string, { loading: boolean; error: string | null }>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Record<string, string>>(
    () => Object.fromEntries(pendingApplications.map((a) => [a.id, "l3"]))
  );

  async function handleReview(applicationId: string, action: "approve" | "reject") {
    setReviewStates((current) => ({
      ...current,
      [applicationId]: { loading: true, error: null }
    }));

    const response = await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId,
        action,
        role: action === "approve" ? roles[applicationId] : undefined,
        reviewNotes: notes[applicationId]
      })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setReviewStates((current) => ({
        ...current,
        [applicationId]: { loading: false, error: body?.error || "Unable to complete review." }
      }));
      return;
    }

    setReviewStates((current) => ({
      ...current,
      [applicationId]: { loading: false, error: null }
    }));
    router.refresh();
  }

  if (!pendingApplications.length) {
    return <p className="text-slate-300">No pending applications at the moment.</p>;
  }

  return (
    <div className="space-y-6">
      {pendingApplications.map((application) => {
        const state = reviewStates[application.id] ?? { loading: false, error: null };
        return (
          <div key={application.id} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Applicant</p>
                <h3 className="text-xl font-semibold text-white">{application.user.name ?? application.user.email}</h3>
                <p className="text-sm text-slate-400">{application.user.school} · {application.user.cohort}</p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <label className="text-sm text-slate-300">
                  Assign tier
                  <select
                    value={roles[application.id] ?? "l3"}
                    onChange={(event) =>
                      setRoles((current) => ({ ...current, [application.id]: event.target.value }))
                    }
                    className="mt-2 block w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  >
                    <option value="l3">L3</option>
                    <option value="l4">L4</option>
                    <option value="l5">L5</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleReview(application.id, "approve")}
                    disabled={state.loading}
                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(application.id, "reject")}
                    disabled={state.loading}
                    className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-900 p-4">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Statement of intent</p>
                <p className="mt-3 text-slate-300 whitespace-pre-wrap">{application.statement}</p>
              </div>
              <div className="rounded-3xl bg-slate-900 p-4">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Technical task</p>
                <p className="mt-3 text-slate-300 whitespace-pre-wrap">{application.rubric?.technicalTask ?? "Not provided."}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-400">
                  {application.taskLink ? (
                    <p>
                      Task link: <a href={application.taskLink} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">View</a>
                    </p>
                  ) : null}
                  {application.portfolioLink ? (
                    <p>
                      Portfolio: <a href={application.portfolioLink} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">View</a>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <label className="mt-5 block text-sm text-slate-300">
              Review notes
              <textarea
                value={notes[application.id] ?? ""}
                onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                className="mt-2 min-h-[120px] w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
            {state.error ? <p className="mt-3 text-sm text-rose-400">{state.error}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
