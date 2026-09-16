import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import AdminModuleProgressClient from "@/components/AdminModuleProgressClient";

export default async function AdminModuleProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true, status: true },
  });
  if (!profile || !["admin", "alumni", "l5"].includes(profile.role)) redirect("/dashboard");

  const [tracks, allProgress] = await Promise.all([
    prisma.skillTrack.findMany({
      orderBy: { order: "asc" },
      include: {
        nodes: { orderBy: { order: "asc" }, select: { id: true, title: true, xpReward: true } },
      },
    }),
    prisma.skillProgress.findMany({
      include: {
        user: { select: { id: true, name: true, role: true, level: true } },
        node: { select: { id: true, title: true, trackId: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <main className="container py-10">
      <AdminModuleProgressClient
        tracks={tracks.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          nodes: t.nodes,
        }))}
        progress={allProgress.map((p) => ({
          ...p,
          verifiedAt: p.verifiedAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </main>
  );
}
