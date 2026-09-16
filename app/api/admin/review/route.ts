import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";

const VALID_ROLES = ["trainer", "alumni", "l5", "l4", "l3"] as const;
type AssignableRole = (typeof VALID_ROLES)[number];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { applicationId, action, role, reviewNotes } = body;

  if (!applicationId || !action) {
    return NextResponse.json({ error: "Missing required review payload." }, { status: 400 });
  }

  // Local auth
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminProfile = await prisma.userProfile.findUnique({ where: { id: user!.id } });

  if (!adminProfile || adminProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const application = await prisma.application.findUnique({ where: { id: applicationId } });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  try {
    if (action === "approve") {
      if (!role || !VALID_ROLES.includes(role as AssignableRole)) {
        return NextResponse.json({ error: "A valid tier role is required for approval." }, { status: 400 });
      }
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "approved", reviewNotes: reviewNotes ?? null, reviewedBy: adminProfile.id }
      });

      // Determine level from role (l3, l4, l5) or keep as role if trainer/alumni
      const level = ["l3", "l4", "l5"].includes(role) ? role : null;

      await prisma.userProfile.update({
        where: { id: application.userId },
        data: {
          status: "approved",
          role: role as AssignableRole,
          level: level, // Set level for students
        }
      });
    } else if (action === "reject") {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: "rejected", reviewNotes: reviewNotes ?? null, reviewedBy: adminProfile.id }
      });
      await prisma.userProfile.update({
        where: { id: application.userId },
        data: { status: "rejected", role: "pending" }
      });
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin review failed", error);
    return NextResponse.json({ error: "Unable to process review at this time." }, { status: 500 });
  }
}
