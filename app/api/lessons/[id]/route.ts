/**
 * GET    /api/lessons/[id]  — fetch a single lesson (approved users)
 * PATCH  /api/lessons/[id]  — edit lesson (admin or owning trainer)
 * DELETE /api/lessons/[id]  — delete lesson (admin or owning trainer)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile, canManageLesson } from "@/lib/trainerGuard";

async function resolveCaller() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return null;
  return getCallerProfile(user.id);
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { status: true },
  });
  if (!profile || profile.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ lesson });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canManageLesson(caller, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, subject, tierVisibility, content, order } = await req.json() as {
    title?: string;
    subject?: string;
    tierVisibility?: string;
    content?: string;
    order?: number;
  };

  const updated = await prisma.lesson.update({
    where: { id: params.id },
    data: {
      ...(title && { title: title.trim() }),
      ...(subject && { subject: subject.trim() }),
      ...(tierVisibility && { tierVisibility }),
      ...(content && { content: content.trim() }),
      ...(order !== undefined && { order }),
    },
  });

  return NextResponse.json({ lesson: updated });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canManageLesson(caller, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.lesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
