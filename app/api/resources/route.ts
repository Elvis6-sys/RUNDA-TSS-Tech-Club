import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile } from "@/lib/trainerGuard";

// GET /api/resources — all approved users
export async function GET() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      trainer: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(resources);
}

// POST /api/resources — admin or trainer (tagged to their subject)
export async function POST(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const isAdmin = caller.role === "admin";
  const isTrainer = caller.role === "trainer";

  if (!isAdmin && !isTrainer) {
    return NextResponse.json({ error: "Only admins or trainers can add resources." }, { status: 403 });
  }

  const { title, url, fileUrl, fileType, content, tierVisibility, subject } =
    await request.json() as {
      title: string;
      url?: string;
      fileUrl?: string;
      fileType?: string;
      content?: string;
      tierVisibility?: string;
      subject?: string;
    };

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  // Trainers must provide a subject and must be assigned to it
  if (isTrainer) {
    if (!subject?.trim()) {
      return NextResponse.json(
        { error: "Trainers must specify a subject for the resource" },
        { status: 400 }
      );
    }
    // Find track by name (case-insensitive)
    const track = await prisma.skillTrack.findFirst({
      where: {
        name: {
          equals: subject.trim()
        }
      }
    });
    if (!track) {
      return NextResponse.json({ error: `No track found for subject "${subject}"` }, { status: 400 });
    }
    // Verify trainer is assigned to this track
    const assignment = await prisma.trainerModule.findFirst({
      where: {
        trackId: track.id,
        trainerId: caller.id
      }
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "You are not assigned to that subject" },
        { status: 403 }
      );
    }
  }

  const resource = await prisma.resource.create({
    data: {
      title,
      url: url ?? null,
      fileUrl: fileUrl ?? null,
      fileType: fileType ?? null,
      content: content ?? null,
      tierVisibility: tierVisibility ?? "all",
      subject: subject?.trim() ?? null,
      trainerId: caller.id, // Set trainerId for both trainers and admins
    },
  });

  return NextResponse.json(resource);
}
