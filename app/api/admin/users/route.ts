import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

const VALID_ROLES = ["admin", "trainer", "alumni", "l5", "l4", "l3", "pending"] as const;
const VALID_STATUSES = ["approved", "pending_review", "rejected"] as const;

export async function PATCH(request: NextRequest) {
  // Local auth
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = await prisma.userProfile.findUnique({ where: { id: user!.id } });

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { userId, role, status } = await request.json();

  if (!userId || !role || !status) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role) || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid role or status." }, { status: 400 });
  }

  // Prevent admins from demoting themselves
  if (userId === user!.id) {
    return NextResponse.json({ error: "You cannot modify your own account." }, { status: 400 });
  }

  await prisma.userProfile.update({
    where: { id: userId },
    data: { role, status }
  });

  return NextResponse.json({ ok: true });
}
