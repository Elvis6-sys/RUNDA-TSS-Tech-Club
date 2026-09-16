import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { getCallerProfile } from "@/lib/trainerGuard";

const TIER_ORDER = ["admin", "trainer", "alumni", "l5", "l4", "l3"];

export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const all = await prisma.challenge.findMany({
    orderBy: { dueDate: "desc" },
    include: {
      submissions: {
        where: { userId: user.id },
        select: { id: true, score: true, submissionUrl: true, note: true, scoredAt: true },
      },
      _count: { select: { submissions: true } },
      trainer: { select: { id: true, name: true } },
    },
  });

  const visible = all.filter(
    (c) => c.tier === "all" || TIER_ORDER.indexOf(profile.role) <= TIER_ORDER.indexOf(c.tier)
  );

  return NextResponse.json(visible);
}

export async function POST(req: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = caller.role === "admin";
  const isTrainer = caller.role === "trainer";
  // alumni and l5 can also post challenges (existing behaviour preserved)
  const isElevated = ["alumni", "l5"].includes(caller.role);

  if (!isAdmin && !isTrainer && !isElevated) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, tier, xpReward, dueDate } = await req.json();
  if (!title || !description || !dueDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Trainers must be assigned to at least one track (sanity check)
  if (isTrainer) {
    const hasTrack = await prisma.trainerModule.findFirst({
      where: { trainerId: caller.id },
    });
    if (!hasTrack) {
      return NextResponse.json(
        { error: "You have no assigned modules yet. Ask an admin to assign you first." },
        { status: 403 }
      );
    }
  }

  const challenge = await prisma.challenge.create({
    data: {
      title,
      description,
      tier: tier ?? "all",
      xpReward: xpReward ?? 30,
      dueDate: new Date(dueDate),
      createdBy: user.id,
      trainerId: isTrainer ? caller.id : null,
    },
  });

  return NextResponse.json(challenge, { status: 201 });
}
