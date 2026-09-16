import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function POST(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { commentId, emoji } = await request.json();
  if (!commentId || !emoji) return NextResponse.json({ error: "commentId and emoji required." }, { status: 400 });

  const existing = await prisma.eventReaction.findUnique({
    where: { commentId_userId_emoji: { commentId, userId: user!.id, emoji } }
  });

  if (existing) {
    await prisma.eventReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  await prisma.eventReaction.create({ data: { commentId, userId: user!.id, emoji } });
  return NextResponse.json({ action: "added" });
}
