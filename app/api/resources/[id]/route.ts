/**
 * PATCH  /api/resources/[id]  — edit resource (admin or owning trainer)
 * DELETE /api/resources/[id]  — delete resource (admin or owning trainer)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile, canManageResource } from "@/lib/trainerGuard";

async function resolveCaller() {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return null;
  return getCallerProfile(user.id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canManageResource(caller, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, url, fileUrl, fileType, content, tierVisibility, subject } =
    await req.json() as Partial<{
      title: string;
      url: string;
      fileUrl: string;
      fileType: string;
      content: string;
      tierVisibility: string;
      subject: string;
    }>;

  const updated = await prisma.resource.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(url !== undefined && { url }),
      ...(fileUrl !== undefined && { fileUrl }),
      ...(fileType !== undefined && { fileType }),
      ...(content !== undefined && { content }),
      ...(tierVisibility && { tierVisibility }),
      ...(subject !== undefined && { subject }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = await resolveCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canManageResource(caller, params.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.resource.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
