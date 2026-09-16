/**
 * GET  /api/admin/trainers  — list all trainers with their assigned tracks
 * POST /api/admin/trainers  — create a new trainer account
 *
 * Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/local-auth";

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

// ── GET — list trainers ───────────────────────────────────────────────────────
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainers = await prisma.userProfile.findMany({
    where: { role: "trainer" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      trainedModules: {
        select: {
          id: true,
          module: {
            select: {
              id: true,
              code: true,
              name: true,
              level: true,
              category: true,
              department: true,
            }
          },
        },
      },
    },
  });

  // Convert DateTime to ISO strings for client serialization
  const serializedTrainers = trainers.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    status: t.status,
    trainedModules: t.trainedModules
      .filter((m) => m.module !== null)
      .map((m) => ({
        id: m.id,
        module: m.module!,
      })),
  }));

  return NextResponse.json({ trainers: serializedTrainers });
}

// ── POST — create trainer ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, phone, password } = await req.json() as {
    name: string;
    email: string;
    phone?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existing = await prisma.userProfile.findUnique({
    where: { email: email.trim() },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 400 }
    );
  }

  // Create the UserProfile with local auth
  try {
    const hashedPassword = await hashPassword(password?.trim() || 'trainer123');

    const profile = await prisma.userProfile.create({
      data: {
        id: `trainer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        email: email.trim(),
        password: hashedPassword,
        name: name.trim(),
        phone: phone?.trim() ?? null,
        role: "trainer",
        status: "approved",    // trainers are active immediately
      },
    });

    return NextResponse.json({
      trainer: profile,
      message: password ? 'Trainer created successfully' : 'Trainer created with default password: trainer123'
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/trainers] DB error:", err);
    return NextResponse.json({ error: "Failed to create trainer profile" }, { status: 500 });
  }
}
