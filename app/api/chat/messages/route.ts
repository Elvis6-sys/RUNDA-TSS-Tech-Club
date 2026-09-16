import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true, role: true, profileImage: true } },
  reactions: { include: { user: { select: { id: true, name: true } } } },
  replyTo: {
    select: {
      id: true, content: true, fileName: true,
      sender: { select: { id: true, name: true } }
    }
  }
} as const;

export async function GET(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const roomId = request.nextUrl.searchParams.get("roomId");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const sinceId = request.nextUrl.searchParams.get("since"); // For polling: get messages newer than this ID

  if (!roomId) return NextResponse.json({ error: "roomId required." }, { status: 400 });

  // Build query for polling (messages since last known message)
  if (sinceId) {
    const sinceMessage = await prisma.message.findUnique({
      where: { id: sinceId },
      select: { createdAt: true }
    });

    if (sinceMessage) {
      const newMessages = await prisma.message.findMany({
        where: {
          roomId,
          createdAt: { gt: sinceMessage.createdAt }
        },
        include: MESSAGE_INCLUDE,
        orderBy: { createdAt: "asc" },
        take: 100 // Get up to 100 new messages
      });
      return NextResponse.json(newMessages);
    }
  }

  // Standard pagination query
  const messages = await prisma.message.findMany({
    where: { roomId, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
    include: MESSAGE_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json(messages.reverse());
}

export async function POST(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: user!.id } });
  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Approved members only." }, { status: 403 });
  }

  const { roomId, content, fileUrl, fileType, fileName, replyToId } = await request.json();
  if (!roomId || (!content?.trim() && !fileUrl)) {
    return NextResponse.json({ error: "roomId and content or file required." }, { status: 400 });
  }

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      roomId,
      senderId: user!.id,
      content: content?.trim() ?? "",
      fileUrl: fileUrl ?? null,
      fileType: fileType ?? null,
      fileName: fileName ?? null,
      replyToId: replyToId ?? null
    },
    include: MESSAGE_INCLUDE
  });

  return NextResponse.json({
    ...message,
    createdAt: message.createdAt.toISOString()
  });
}
