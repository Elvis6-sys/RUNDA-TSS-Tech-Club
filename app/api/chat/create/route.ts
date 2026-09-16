/**
 * POST /api/chat/create
 *
 * Trainers can create module-specific chat rooms.
 * Admins can create any room.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile } from "@/lib/trainerGuard";

export async function POST(req: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = caller.role === "admin";
  const isTrainer = caller.role === "trainer";

  if (!isAdmin && !isTrainer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, type, tierVisibility, trackId } = await req.json() as {
    name: string;
    type: "general" | "tier" | "project" | "direct" | "module";
    tierVisibility?: string;
    trackId?: string;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Trainers can only create module-type rooms for their assigned tracks
  if (isTrainer) {
    if (type !== "module" || !trackId) {
      return NextResponse.json(
        { error: "Trainers can only create module-specific chat rooms" },
        { status: 400 }
      );
    }
    // Verify trainer is assigned to this track
    const assignment = await prisma.trainerModule.findFirst({
      where: {
        trainerId: caller.id,
        trackId: trackId
      },
    });
    if (!assignment) {
      return NextResponse.json({ error: "You are not assigned to that track" }, { status: 403 });
    }
  }

  const room = await prisma.chatRoom.create({
    data: {
      name: name.trim(),
      type,
      tierVisibility: tierVisibility ?? null,
    },
  });

  return NextResponse.json({ room }, { status: 201 });
}
