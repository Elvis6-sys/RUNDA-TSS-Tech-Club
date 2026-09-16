/**
 * PATCH  /api/admin/trainers/[trainerId]  — update trainer's name/phone/status
 * DELETE /api/admin/trainers/[trainerId]  — remove trainer (profile)
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

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { trainerId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainer = await prisma.userProfile.findUnique({
    where: { id: params.trainerId },
    select: { role: true },
  });
  if (!trainer || trainer.role !== "trainer") {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  const { name, phone, status } = await req.json() as {
    name?: string;
    phone?: string;
    status?: string;
  };

  const validStatuses = ["approved", "pending_review", "rejected"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.userProfile.update({
    where: { id: params.trainerId },
    data: {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() ?? null }),
      ...(status && { status: status as "approved" | "pending_review" | "rejected" }),
    },
    select: { id: true, name: true, email: true, phone: true, status: true },
  });

  return NextResponse.json({ trainer: updated });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { trainerId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainer = await prisma.userProfile.findUnique({
    where: { id: params.trainerId },
    select: { role: true },
  });
  if (!trainer || trainer.role !== "trainer") {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  // Remove profile (cascades TrainerModule rows, and nullifies trainerId FK on
  // lessons/resources/challenges via SET NULL — handled by Prisma nullable relation)
  await prisma.userProfile.delete({ where: { id: params.trainerId } });

  // Note: With local auth, user deletion is handled by Prisma cascade
  // The user record is removed when the profile is deleted

  return NextResponse.json({ ok: true });
}
