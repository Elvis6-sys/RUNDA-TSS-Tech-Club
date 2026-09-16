import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { createLiveKitToken } from "@/lib/livekit";

type Params = { params: { id: string } };

// POST /api/sessions/[id] — member joins, gets a participant token
export async function POST(_req: NextRequest, { params }: Params) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Approved members only" }, { status: 403 });
  }

  const audioSession = await prisma.audioSession.findUnique({ where: { id: params.id } });
  if (!audioSession || audioSession.status !== "live") {
    return NextResponse.json({ error: "Session not found or ended" }, { status: 404 });
  }

  // Check eligibility
  const allowed =
    audioSession.hostId === profile.id ||
    audioSession.allowedRoles === "all" ||
    audioSession.allowedRoles.split(",").includes(profile.role);

  if (!allowed) return NextResponse.json({ error: "Not allowed in this session" }, { status: 403 });

  const token = await createLiveKitToken(
    audioSession.roomName,
    profile.name ?? "Member",
    profile.id,
    true // all participants can publish (speak)
  );

  return NextResponse.json({ token, livekitUrl: process.env.LIVEKIT_URL, session: audioSession });
}

// PATCH /api/sessions/[id] — host ends the session
export async function PATCH(_req: NextRequest, { params }: Params) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const audioSession = await prisma.audioSession.findUnique({ where: { id: params.id } });
  if (!audioSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audioSession.hostId !== user.id) {
    return NextResponse.json({ error: "Only the host can end the session" }, { status: 403 });
  }

  const updated = await prisma.audioSession.update({
    where: { id: params.id },
    data: { status: "ended" },
  });

  return NextResponse.json(updated);
}
