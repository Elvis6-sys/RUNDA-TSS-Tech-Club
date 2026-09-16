import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true, role: true } },
  reactions: { include: { user: { select: { id: true, name: true } } } },
  replyTo: {
    select: {
      id: true, content: true, fileName: true,
      sender: { select: { id: true, name: true } }
    }
  }
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const message = await prisma.message.findUnique({
    where: { id: params.messageId },
    include: MESSAGE_INCLUDE
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...message,
    createdAt: message.createdAt.toISOString()
  });
}
