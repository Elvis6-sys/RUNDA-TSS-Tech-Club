import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function GET(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required." }, { status: 400 });

  const comments = await prisma.eventComment.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, role: true } },
      reactions: { include: { user: { select: { id: true, name: true } } } }
    },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: user!.id } });
  if (!profile || profile.status !== "approved") return NextResponse.json({ error: "Approved members only." }, { status: 403 });

  const { eventId, content } = await request.json();
  if (!eventId || !content?.trim()) return NextResponse.json({ error: "eventId and content required." }, { status: 400 });

  const comment = await prisma.eventComment.create({
    data: { eventId, userId: user!.id, content: content.trim() },
    include: {
      user: { select: { id: true, name: true, role: true } },
      reactions: { include: { user: { select: { id: true, name: true } } } }
    }
  });

  return NextResponse.json(comment);
}
