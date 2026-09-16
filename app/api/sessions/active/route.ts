import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: user!.id } });
  if (!profile || profile.status !== "approved") return NextResponse.json({ session: null });

  const liveSessions = await prisma.audioSession.findMany({
    where: { status: "live" },
    include: { host: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Return sessions this user is allowed to join (host always sees their own)
  const eligible = liveSessions.filter((s) => {
    if (s.hostId === profile.id) return true;
    if (s.allowedRoles === "all") return true;
    return s.allowedRoles.split(",").includes(profile.role);
  });

  return NextResponse.json({ sessions: eligible });
}
