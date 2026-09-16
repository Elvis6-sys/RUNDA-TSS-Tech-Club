/**
 * POST   /api/admin/trainers/[trainerId]/assign    — assign trainer to a curriculum module
 * DELETE /api/admin/trainers/[trainerId]/assign    — unassign trainer from a module
 *
 * Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!profile || profile.role !== "admin") return null;
  return user;
}

// ── POST — assign ─────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { trainerId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { moduleId } = await req.json() as { moduleId: string };
  if (!moduleId) {
    return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
  }

  const trainer = await prisma.userProfile.findUnique({
    where: { id: params.trainerId },
    select: { role: true },
  });
  if (!trainer || trainer.role !== "trainer") {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  const module = await prisma.curriculumModule.findUnique({
    where: { id: moduleId },
    select: { id: true, name: true, code: true },
  });
  if (!module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // Check if trainer already has this module assigned
  const existing = await prisma.trainerModule.findFirst({
    where: {
      trainerId: params.trainerId,
      moduleId: moduleId,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "This module is already assigned to this trainer" },
      { status: 409 }
    );
  }

  // Create assignment
  const assignment = await prisma.trainerModule.create({
    data: {
      trainerId: params.trainerId,
      moduleId: moduleId,
    },
    include: {
      module: {
        select: {
          id: true,
          code: true,
          name: true,
          level: true,
          category: true,
          department: true,
        },
      },
    },
  });

  return NextResponse.json({ assignment }, { status: 201 });
}

// ── DELETE — unassign ─────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { trainerId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { moduleId } = await req.json() as { moduleId: string };
  if (!moduleId) {
    return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
  }

  const existing = await prisma.trainerModule.findFirst({
    where: {
      trainerId: params.trainerId,
      moduleId: moduleId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "No such assignment" }, { status: 404 });
  }

  await prisma.trainerModule.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
