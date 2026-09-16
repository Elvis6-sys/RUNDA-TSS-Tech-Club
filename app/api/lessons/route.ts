import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile } from "@/lib/trainerGuard";

async function getProfile() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.userProfile.findUnique({ where: { id: user.id } });
}

// GET /api/lessons — returns lessons visible to this user's tier
export async function GET() {
  const profile = await getProfile();
  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { tierVisibility: "all" },
        { tierVisibility: profile.role },
      ],
    },
    orderBy: [{ subject: "asc" }, { order: "asc" }],
    select: {
      id: true,
      title: true,
      subject: true,
      tierVisibility: true,
      order: true,
      content: true,
      updatedAt: true,
      trainerId: true,
    },
  });

  return NextResponse.json({ lessons });
}

// POST /api/lessons — admin or trainer (for their assigned subject) creates a lesson
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

  const { title, subject, tierVisibility, content, order } =
    await req.json() as {
      title: string;
      subject: string;
      tierVisibility: string;
      content: string;
      order?: number;
    };

  if (!title?.trim() || !subject?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title, subject and content are required" }, { status: 400 });
  }

  // Trainers may only create lessons for a subject tied to their assigned track
  if (isTrainer) {
    const track = await prisma.skillTrack.findFirst({ where: { name: subject } });
    if (!track) {
      return NextResponse.json(
        { error: "No skill track found matching that subject" },
        { status: 400 }
      );
    }
    const assignment = await prisma.trainerModule.findFirst({
      where: {
        trackId: track.id,
        trainerId: caller.id
      },
    });
    if (!assignment || assignment.trainerId !== caller.id) {
      return NextResponse.json(
        { error: "You are not assigned to that subject" },
        { status: 403 }
      );
    }
  }

  const lesson = await prisma.lesson.create({
    data: {
      title: title.trim(),
      subject: subject.trim(),
      tierVisibility: tierVisibility ?? "all",
      content: content.trim(),
      order: order ?? 0,
      trainerId: isTrainer ? caller.id : null,
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
