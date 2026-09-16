import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/ProjectsClient";

const TIER_ORDER = ["admin", "trainer", "alumni", "l5", "l4", "l3"];

function canSeeProject(userRole: string, tierVisibility: string) {
  if (tierVisibility === "all") return true;
  return TIER_ORDER.indexOf(userRole) <= TIER_ORDER.indexOf(tierVisibility);
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile || profile.status !== "approved") redirect("/dashboard");

  const allProjects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });
  const projects = allProjects.filter((p) => canSeeProject(profile.role, p.tierVisibility));

  const canCreate = ["admin", "trainer"].includes(profile.role);

  return (
    <main className="container py-10">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Projects</h1>
            <p className="mt-2 text-slate-400">Club projects visible to your tier and above.</p>
          </div>
        </div>
        <ProjectsClient
          projects={projects.map((p) => ({
            ...p,
            createdAt: p.createdAt,
            members: p.members.map((m) => ({
              ...m,
              requestedAt: m.requestedAt,
              approvedAt: m.approvedAt,
            })),
          }))}
          canCreate={canCreate}
          userId={profile.id}
          role={profile.role}
        />
      </div>
    </main>
  );
}
