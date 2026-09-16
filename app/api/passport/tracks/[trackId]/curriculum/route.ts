/**
 * POST   /api/passport/tracks/[trackId]/curriculum — upload curriculum file
 * PATCH  /api/passport/tracks/[trackId]/curriculum — update table of contents
 * DELETE /api/passport/tracks/[trackId]/curriculum — remove curriculum file
 *
 * Admin or assigned trainer only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";

async function resolveCaller() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return null;
  return getCallerProfile(user.id);
}

// ── POST — upload curriculum ──────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canManageTrack(caller, params.trackId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { curriculumUrl, curriculumType } = await req.json() as {
    curriculumUrl: string;
    curriculumType: string;
  };

  if (!curriculumUrl) {
    return NextResponse.json({ error: "curriculumUrl required" }, { status: 400 });
  }

  const updated = await prisma.skillTrack.update({
    where: { id: params.trackId },
    data: { curriculumUrl, curriculumType },
  });

  return NextResponse.json({ track: updated });
}

// ── PATCH — update table of contents ──────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canManageTrack(caller, params.trackId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { tableOfContents } = await req.json() as { tableOfContents: Record<string, unknown>[] };

  if (!Array.isArray(tableOfContents)) {
    return NextResponse.json({ error: "tableOfContents must be an array" }, { status: 400 });
  }

  const updated = await prisma.skillTrack.update({
    where: { id: params.trackId },
    data: { tableOfContents: JSON.parse(JSON.stringify(tableOfContents)) },
  });

  return NextResponse.json({ track: updated });
}

// ── DELETE — remove curriculum ────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canManageTrack(caller, params.trackId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.skillTrack.update({
    where: { id: params.trackId },
    data: { curriculumUrl: null, curriculumType: null, tableOfContents: JSON.stringify([]) },
  });

  return NextResponse.json({ track: updated });
}
