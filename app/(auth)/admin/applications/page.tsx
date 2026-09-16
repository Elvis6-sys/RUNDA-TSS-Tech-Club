import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { getDepartmentName } from "@/lib/departments";

const STATUS_STYLE: Record<string, string> = {
  pending_review: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  pending_review: "⏳ Pending",
  approved: "✅ Approved",
  rejected: "❌ Rejected",
};

export default async function ApplicationsListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const applications = await prisma.application.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: {
          id: true, name: true, email: true,
          role: true, status: true, department: true, // Added department
        },
      },
    },
  });

  type AppWithUser = (typeof applications)[number];

  const pending = applications.filter(a => a.status === "pending_review");
  const reviewed = applications.filter(a => a.status !== "pending_review");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-xs text-slate-500 hover:text-slate-300 transition">
              ← Admin Hub
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-white">Member Applications</h1>
            <p className="text-sm text-slate-400 mt-1">
              {pending.length} pending · {reviewed.length} reviewed
            </p>
          </div>
        </div>

        {/* ── Pending ── */}
        {pending.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
            <p className="text-3xl mb-3">🎉</p>
            <p className="text-white font-semibold">All caught up!</p>
            <p className="text-slate-500 text-sm mt-1">No applications awaiting review.</p>
          </div>
        ) : (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Awaiting Review ({pending.length})
            </h2>
            {pending.map(app => (
              <ApplicationRow key={app.id} app={app} />
            ))}
          </section>
        )}

        {/* ── Reviewed ── */}
        {reviewed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Previously Reviewed ({reviewed.length})
            </h2>
            {reviewed.map(app => (
              <ApplicationRow key={app.id} app={app} />
            ))}
          </section>
        )}

      </div>
    </main>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

function ApplicationRow({ app }: {
  app: {
    id: string;
    status: string;
    createdAt: Date;
    statement: string;
    taskLink: string | null;
    portfolioLink: string | null;
    department: string | null; // Added department
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
      department: string | null; // Added department
    };
  };
}) {
  const isPending = app.status === "pending_review";

  return (
    <div className={`rounded-2xl border bg-slate-900 p-5 transition hover:bg-slate-800/60 ${isPending ? "border-amber-500/30" : "border-slate-700/50"
      }`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">

        {/* User info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${isPending ? "from-amber-500 to-orange-600" : "from-slate-600 to-slate-700"
            }`}>
            {app.user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{app.user.name ?? "Unknown"}</p>
            <p className="text-xs text-slate-500 truncate">{app.user.email}</p>
          </div>
        </div>

        {/* Status + date */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_STYLE[app.status] ?? STATUS_STYLE.pending_review
            }`}>
            {STATUS_LABEL[app.status] ?? app.status}
          </span>
          <span className="text-xs text-slate-600">
            {new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Statement preview */}
      <p className="mt-3 text-sm text-slate-400 line-clamp-2 leading-relaxed">
        {app.statement}
      </p>

      {/* Department badge */}
      {app.department && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-700/50">
            <span className="text-base">
              {app.department === 'software-development' ? '💻' :
                app.department === 'computer-systems-architecture' ? '🖥️' :
                  app.department === 'land-surveying' ? '📐' :
                    app.department === 'building-construction' ? '🏗️' : '🎓'}
            </span>
            {getDepartmentName(app.department)}
          </span>
        </div>
      )}

      {/* Links row */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {app.taskLink && (
          <a href={app.taskLink} target="_blank" rel="noreferrer"
            className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1">
            🔗 Task submission
          </a>
        )}
        {app.portfolioLink && (
          <a href={app.portfolioLink} target="_blank" rel="noreferrer"
            className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1">
            💼 Portfolio
          </a>
        )}
        <Link
          href={`/admin/applications/${app.id}`}
          className={`ml-auto shrink-0 rounded-xl px-4 py-1.5 text-xs font-bold transition ${isPending
            ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
            : "border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
            }`}
        >
          {isPending ? "Review →" : "View details →"}
        </Link>
      </div>
    </div>
  );
}
