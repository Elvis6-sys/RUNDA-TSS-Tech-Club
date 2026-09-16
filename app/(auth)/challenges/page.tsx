import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import ChallengesClient from "@/components/ChallengesClient";

const TIER_ORDER = ["admin", "trainer", "alumni", "l5", "l4", "l3"];

export default async function ChallengesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true, status: true },
  });
  if (!profile || profile.status !== "approved") redirect("/dashboard");

  const all = await prisma.challenge.findMany({
    orderBy: { dueDate: "desc" },
    include: {
      submissions: {
        where: { userId: user.id },
        select: { id: true, score: true, submissionUrl: true, note: true, scoredAt: true },
      },
      _count: { select: { submissions: true } },
    },
  });

  const challenges = all.filter(
    (c) => c.tier === "all" || TIER_ORDER.indexOf(profile.role) <= TIER_ORDER.indexOf(c.tier)
  );

  const canCreate = ["admin", "trainer"].includes(profile.role);
  const canScore = ["admin", "alumni", "l5"].includes(profile.role);

  return (
    <main className="container py-10">
      <ChallengesClient
        challenges={challenges.map((c) => ({
          ...c,
          dueDate: c.dueDate.toISOString(),
          createdAt: c.createdAt.toISOString(),
          mySubmission: c.submissions[0]
            ? { ...c.submissions[0], scoredAt: c.submissions[0].scoredAt?.toISOString() ?? null }
            : null,
          submissionCount: c._count.submissions,
        }))}
        canCreate={canCreate}
        canScore={canScore}
        userId={user.id}
      />
    </main>
  );
}
