import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { createLiveKitToken } from "@/lib/livekit";

const HOST_ROLES = ["admin", "alumni", "l5"];

export async function POST(req: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: user!.id } });
  if (!profile || profile.status !== "approved" || !HOST_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Only admin, alumni or L5 can host sessions" }, { status: 403 });
  }

  const { title, allowedRoles } = await req.json() as { title: string; allowedRoles: string[] };
  if (!title?.trim() || !allowedRoles?.length) {
    return NextResponse.json({ error: "title and allowedRoles required" }, { status: 400 });
  }

  // End any previous live session by this host
  await prisma.audioSession.updateMany({
    where: { hostId: profile.id, status: "live" },
    data: { status: "ended" },
  });

  const roomName = `session-${profile.id}-${Date.now()}`;
  const audioSession = await prisma.audioSession.create({
    data: {
      title: title.trim(),
      roomName,
      hostId: profile.id,
      allowedRoles: allowedRoles.join(","),
      status: "live",
    },
  });

  const token = await createLiveKitToken(roomName, profile.name ?? "Host", profile.id, true);
  return NextResponse.json({ session: audioSession, token, livekitUrl: process.env.LIVEKIT_URL });
}
