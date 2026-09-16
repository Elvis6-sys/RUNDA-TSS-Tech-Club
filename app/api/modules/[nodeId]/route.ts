import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/local-auth";
import { prisma } from "@/lib/prisma";
import { getCallerProfile, canManageNode } from "@/lib/trainerGuard";

// GET — fetch a module node with blocks + caller's block progress
export async function GET(_req: NextRequest, { params }: { params: { nodeId: string } }) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const node = await prisma.skillNode.findUnique({
    where: { id: params.nodeId },
    include: {
      track: { select: { name: true, icon: true } },
      progress: { where: { userId: user.id } },
      blockProgress: { where: { userId: user.id } },
    },
  });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(node);
}

// PATCH — admin, alumni, l5, or a trainer assigned to this node's track
export async function PATCH(req: NextRequest, { params }: { params: { nodeId: string } }) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Legacy elevated roles + trainer ownership check
  const legacyAllowed = ["admin", "alumni", "l5"].includes(caller.role);
  const trainerAllowed = caller.role === "trainer" && (await canManageNode(caller, params.nodeId));

  if (!legacyAllowed && !trainerAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { blocks, estimatedMinutes, videoUrl, description } = await req.json();

  const updated = await prisma.skillNode.update({
    where: { id: params.nodeId },
    data: {
      ...(blocks !== undefined && { blocks }),
      ...(estimatedMinutes !== undefined && { estimatedMinutes }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(description !== undefined && { description }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE — admin or trainer assigned to this node's track
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = caller.role === "admin";
  const trainerAllowed =
    caller.role === "trainer" && (await canManageNode(caller, params.nodeId));

  if (!isAdmin && !trainerAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.skillNode.delete({ where: { id: params.nodeId } });
  return NextResponse.json({ ok: true });
}
