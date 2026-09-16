import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ResourcesClient from "@/components/ResourcesClient";

export default async function ResourcesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile || profile.status !== "approved") redirect("/dashboard");

  const allResources = await prisma.resource.findMany({ orderBy: { createdAt: "desc" } });

  // Filter resources by user level for students
  let resources = allResources;
  if (["l3", "l4", "l5"].includes(profile.role)) {
    // Students see resources for their level OR "Everyone" resources
    resources = allResources.filter((r) =>
      r.tierVisibility === profile.level || r.tierVisibility === "all"
    );
  }
  // Admins and trainers see all resources

  return (
    <main className="container py-10">
      <div className="space-y-8">
        <h1 className="text-3xl font-semibold text-white">Resources</h1>
        <ResourcesClient
          resources={resources}
          isAdmin={profile.role === "admin"}
          isTrainer={profile.role === "trainer"}
          currentUserId={profile.id}
          userLevel={profile.level ?? undefined}
        />
      </div>
    </main>
  );
}
