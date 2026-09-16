import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function POST(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { messageId, emoji } = await request.json();
  if (!messageId || !emoji) return NextResponse.json({ error: "messageId and emoji required." }, { status: 400 });

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId: user!.id, emoji } }
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: "removed" });
  }

  await prisma.messageReaction.create({ data: { messageId, userId: user!.id, emoji } });
  return NextResponse.json({ action: "added" });
}
