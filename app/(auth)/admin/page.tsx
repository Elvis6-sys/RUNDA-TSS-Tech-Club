import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BackgroundEffect from "@/components/BackgroundEffect";

type AdminCard = {
  href: string;
  emoji: string;
  title: string;
  description: string;
  accent: string;
};

const CARDS: AdminCard[] = [
  {
    href: "/admin/applications",
    emoji: "📋",
    title: "Applications",
    description: "Review, approve or reject member applications with full applicant details.",
    accent: "border-amber-500/30 hover:border-amber-400/50",
  },
  {
    href: "/admin/trainers",
    emoji: "👨‍🏫",
    title: "Trainers",
    description: "Create trainer accounts and assign them to skill-track modules.",
    accent: "border-violet-500/30 hover:border-violet-400/50",
  },
  {
    href: "/admin/module-progress",
    emoji: "📊",
    title: "Module Progress",
    description: "View every student's progress across all skill-track modules.",
    accent: "border-sky-500/30 hover:border-sky-400/50",
  },
];

export default async function AdminHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true, name: true },
  });
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  // Quick stats
  const [memberCount, pendingCount, trainerCount] = await Promise.all([
    prisma.userProfile.count({ where: { status: "approved" } }),
    prisma.application.count({ where: { status: "pending_review" } }),
    prisma.userProfile.count({ where: { role: "trainer" } }),
  ]);

  return (
    <main className="relative min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <BackgroundEffect />

      <div className="relative mx-auto max-w-4xl space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-rose-400">Admin Hub</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Admin Panel
          </h1>
          <p className="mt-2 text-slate-400 max-w-xl">
            Manage the platform — review members, assign trainers to modules,
            and monitor student progress.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Approved members", value: memberCount },
            { label: "Pending applications", value: pendingCount },
            { label: "Active trainers", value: trainerCount },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-[1.5rem] border border-slate-700/40 bg-slate-900/90 px-5 py-5"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Nav cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`rounded-[1.75rem] border bg-slate-900/90 px-6 py-7 transition hover:bg-slate-900 ${card.accent}`}
            >
              <p className="text-3xl">{card.emoji}</p>
              <p className="mt-4 text-xl font-semibold text-white">{card.title}</p>
              <p className="mt-2 text-sm text-slate-400">{card.description}</p>
            </Link>
          ))}
        </div>

        {/* Pending applications shortcut */}
        {pendingCount > 0 && (
          <div className="rounded-[1.75rem] border border-amber-500/30 bg-amber-500/5 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {pendingCount} application{pendingCount !== 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve or reject from the dashboard.
              </p>
            </div>
            <Link
              href="/admin/applications"
              className="shrink-0 rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Review →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
