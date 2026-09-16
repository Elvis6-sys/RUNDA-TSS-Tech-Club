import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ApplicationReviewClient from "./ApplicationReviewClient";

export default async function ApplicationReviewPage({
  params,
}: {
  params: { applicationId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const admin = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!admin || admin.role !== "admin") redirect("/dashboard");

  const app = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      user: {
        select: {
          id: true, name: true, email: true,
          role: true, status: true, cohort: true,
          level: true, department: true, createdAt: true, // Added department
        },
      },
    },
  });

  if (!app) redirect("/admin/applications");

  let reviewerName: string | null = null;
  if (app.reviewedBy) {
    const reviewer = await prisma.userProfile.findUnique({
      where: { id: app.reviewedBy },
      select: { name: true },
    });
    reviewerName = reviewer?.name ?? null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link href="/admin/applications"
            className="text-xs text-slate-500 hover:text-slate-300 transition">
            ← Back to applications
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-white">Application Review</h1>
        </div>

        <ApplicationReviewClient
          app={{
            id: app.id,
            status: app.status,
            statement: app.statement,
            taskLink: app.taskLink,
            portfolioLink: app.portfolioLink,
            reviewNotes: app.reviewNotes,
            createdAt: app.createdAt.toISOString(),
            rubric: (typeof app.rubric === 'string' ? JSON.parse(app.rubric) : app.rubric) as Record<string, unknown>,
            department: app.department, // Added department
          }}
          applicant={{
            id: app.user.id,
            name: app.user.name,
            email: app.user.email,
            role: app.user.role,
            status: app.user.status,
            cohort: app.user.cohort,
            level: app.user.level,
            department: app.user.department, // Added department
            joinedAt: app.user.createdAt.toISOString(),
          }}
          reviewerName={reviewerName}
        />
      </div>
    </main>
  );
}
