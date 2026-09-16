import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from "@/lib/local-auth";

// POST /api/toc/entry/[entryId]/duplicate - Duplicate a TOC entry and its descendants
export async function POST(
  req: NextRequest,
  { params }: { params: { entryId: string } }
) {
  // Local auth
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const entryId = params.entryId;

    // Get the entry
    const entry = await prisma.customTocEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Verify the user is a trainer for this track
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      include: {
        trainedModules: {
          where: { trackId: entry.trackId },
        },
      },
    });

    if (!profile || (profile.role !== 'admin' && profile.trainedModules.length === 0)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Recursive duplication function
    async function duplicateEntry(originalId: string, newParentId: string | null): Promise<string> {
      // Fetch original entry
      const original = await prisma.customTocEntry.findUnique({
        where: { id: originalId },
      });

      if (!original) {
        throw new Error(`Entry ${originalId} not found`);
      }

      // Create duplicate
      const newEntry = await prisma.customTocEntry.create({
        data: {
          trackId: original.trackId,
          trainerId: original.trainerId,
          type: original.type,
          parentId: newParentId,
          title: original.title + ' (copy)',
          description: original.description,
          hours: original.hours,
          order: original.order + 0.1, // Place right after original
          isCustom: true,
          sourceId: original.sourceId,
        },
      });

      // Find and duplicate children
      const children = await prisma.customTocEntry.findMany({
        where: { parentId: originalId },
      });

      for (const child of children) {
        await duplicateEntry(child.id, newEntry.id);
      }

      return newEntry.id;
    }

    // Start duplication
    const newEntryId = await duplicateEntry(entryId, entry.parentId);

    return NextResponse.json({ entryId: newEntryId, message: 'Entry duplicated successfully' });
  } catch (error: any) {
    console.error('[Duplicate TOC entry] Error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate entry', details: error.message },
      { status: 500 }
    );
  }
}
