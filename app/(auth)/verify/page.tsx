import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import VerifyQueueClient from "@/components/VerifyQueueClient";

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true, status: true, name: true },
  });
  if (!profile || profile.status !== "approved") redirect("/dashboard");
  if (!["admin", "alumni", "l5"].includes(profile.role)) redirect("/passport");

  const queue = await prisma.skillProgress.findMany({
    where: { status: "done" },
    orderBy: { updatedAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, level: true, cohort: true } },
      node: {
        select: {
          id: true, title: true, xpReward: true,
          track: { select: { name: true, icon: true } },
        },
      },
    },
  });

  return (
    <main className="container py-10">
      <VerifyQueueClient
        initialQueue={queue.map((q) => ({
          ...q,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          verifiedAt: q.verifiedAt?.toISOString() ?? null,
        }))}
        verifierName={profile.name ?? "Verifier"}
      />
    </main>
  );
}
