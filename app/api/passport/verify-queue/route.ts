import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const verifier = await prisma.userProfile.findUnique({
    where: { id: user!.id },
    select: { role: true },
  });
  if (!verifier || !["admin", "alumni", "l5"].includes(verifier.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  return NextResponse.json(queue);
}
