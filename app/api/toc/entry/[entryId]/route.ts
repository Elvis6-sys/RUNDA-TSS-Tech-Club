import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCallerProfile } from '@/lib/trainerGuard';
import { getCurrentUser } from "@/lib/local-auth";
import { emitTrackChange } from '@/lib/trackEvents';

// PATCH /api/toc/entry/[entryId] - Update a TOC entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { entryId: string } }
) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = await getCallerProfile(user.id);
    if (!caller || !['trainer', 'admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { entryId } = params;
    const body = await req.json();
    const { title, description, hours, order } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (hours !== undefined) updateData.hours = hours;
    if (order !== undefined) updateData.order = order;

    const entry = await prisma.customTocEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    // 🔔 Notify students instantly
    emitTrackChange(entry.trackId, 'entry_updated');

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('[TOC PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update TOC entry' }, { status: 500 });
  }
}

// DELETE /api/toc/entry/[entryId] - Delete a TOC entry and its children
export async function DELETE(
  req: NextRequest,
  { params }: { params: { entryId: string } }
) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = await getCallerProfile(user.id);
    if (!caller || !['trainer', 'admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { entryId } = params;

    // Read trackId before deletion so we can emit to the right track
    const target = await prisma.customTocEntry.findUnique({
      where: { id: entryId },
      select: { trackId: true },
    });

    const deleteRecursive = async (id: string) => {
      const children = await prisma.customTocEntry.findMany({ where: { parentId: id } });
      for (const child of children) await deleteRecursive(child.id);
      await prisma.customTocEntry.delete({ where: { id } });
    };

    await deleteRecursive(entryId);

    // 🔔 Notify students instantly
    if (target) emitTrackChange(target.trackId, 'entry_deleted');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TOC DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete TOC entry' }, { status: 500 });
  }
}
