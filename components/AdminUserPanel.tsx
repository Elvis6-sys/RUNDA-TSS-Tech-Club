"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string | null;
  school: string | null;
  cohort: string | null;
  role: string;
  status: string;
  createdAt: string;
};

const ROLES = ["admin", "trainer", "alumni", "l5", "l4", "l3", "pending"];
const STATUSES = ["approved", "pending_review", "rejected"];

export default function AdminUserPanel({ users, currentAdminId }: { users: User[]; currentAdminId: string }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function handleUpdate(userId: string, role: string, status: string) {
    setLoadingId(userId);
    setError(null);

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role, status })
    });

    setLoadingId(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body?.error || "Failed to update user.");
      return;
    }

    router.refresh();
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <input
        type="search"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 sm:max-w-sm"
      />

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}

      <div className="overflow-x-auto rounded-3xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">School / Cohort</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No members found.
                </td>
              </tr>
            )}
            {filtered.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentAdminId}
                loading={loadingId === user.id}
                onSave={handleUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  loading,
  onSave
}: {
  user: User;
  isSelf: boolean;
  loading: boolean;
  onSave: (id: string, role: string, status: string) => void;
}) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const changed = role !== user.role || status !== user.status;

  const selectClass =
    "rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100 text-xs disabled:opacity-50";

  return (
    <tr className="transition hover:bg-slate-900/40">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-100">{user.name ?? "—"}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
        {isSelf && <span className="mt-1 inline-block rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-300">You</span>}
      </td>
      <td className="px-4 py-3 text-slate-400">
        <p>{user.school ?? "—"}</p>
        <p className="text-xs">{user.cohort ?? "—"}</p>
      </td>
      <td className="px-4 py-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={isSelf || loading}
          className={selectClass}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.toUpperCase()}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={isSelf || loading}
          className={selectClass}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        {!isSelf && (
          <button
            onClick={() => onSave(user.id, role, status)}
            disabled={!changed || loading}
            className="rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        )}
      </td>
    </tr>
  );
}
