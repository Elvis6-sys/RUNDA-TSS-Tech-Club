import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { getCallerProfile, canManageChallenge } from "@/lib/trainerGuard";

// POST — student submits to a challenge
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { submissionUrl, note } = await req.json();
  if (!submissionUrl) return NextResponse.json({ error: "submissionUrl required" }, { status: 400 });

  const challenge = await prisma.challenge.findUnique({ where: { id: params.id } });
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (challenge.status === "closed")
    return NextResponse.json({ error: "Challenge is closed" }, { status: 409 });

  const submission = await prisma.challengeSubmission.upsert({
    where: { challengeId_userId: { challengeId: params.id, userId: user.id } },
    update: { submissionUrl, note: note ?? null },
    create: { challengeId: params.id, userId: user.id, submissionUrl, note: note ?? null },
  });

  return NextResponse.json(submission, { status: 201 });
}

// PATCH — scorer gives a score 1-5 (admin, trainer who owns the challenge, alumni, l5)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // trainers may only score their own challenges
  const isScoringAllowed =
    ["admin", "alumni", "l5"].includes(caller.role) ||
    (caller.role === "trainer" && (await canManageChallenge(caller, params.id)));

  if (!isScoringAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { submissionId, score } = await req.json();
  if (!submissionId || typeof score !== "number" || score < 1 || score > 5)
    return NextResponse.json({ error: "score must be 1–5" }, { status: 400 });

  const existing = await prisma.challengeSubmission.findUnique({
    where: { id: submissionId },
    include: { challenge: { select: { xpReward: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const alreadyScored = existing.score !== null;

  const xpMultipliers: Record<number, number> = { 1: 0.4, 2: 0.7, 3: 1, 4: 1.3, 5: 1.6 };
  const xpAwarded = Math.round(existing.challenge.xpReward * xpMultipliers[score]);

  const updated = await prisma.challengeSubmission.update({
    where: { id: submissionId },
    data: { score, scoredBy: user.id, scoredAt: new Date() },
  });

  if (!alreadyScored) {
    await prisma.$transaction([
      prisma.userProfile.update({
        where: { id: existing.userId },
        data: { xp: { increment: xpAwarded } },
      }),
      prisma.xpEvent.create({
        data: {
          userId: existing.userId,
          amount: xpAwarded,
          reason: "challenge_submitted",
          refId: existing.challengeId,
        },
      }),
    ]);
  }

  return NextResponse.json({ ...updated, xpAwarded: alreadyScored ? 0 : xpAwarded });
}

// DELETE — admin or owning trainer can close/delete a challenge
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canManageChallenge(caller, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.challenge.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
