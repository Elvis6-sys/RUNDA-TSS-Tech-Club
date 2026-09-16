import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from "@/lib/local-auth";

// POST /api/toc/entry/[entryId]/convert - Convert TOC entry type
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
    const { targetType } = await req.json();
    const entryId = params.entryId;

    if (!targetType || !['topic', 'subtopic', 'item'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
    }

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

    // Conversion rules:
    // topic → subtopic: parent stays the same (should be a learning outcome)
    // subtopic → topic: parent should be changed to the grandparent (learning outcome)
    // subtopic → item: parent stays the same (should be a topic)
    // item → subtopic: parent stays the same (should be a topic)

    let newParentId = entry.parentId;

    if (entry.type === 'subtopic' && targetType === 'topic') {
      // Find the parent (topic) and use its parent (learning outcome)
      if (entry.parentId) {
        const parentEntry = await prisma.customTocEntry.findUnique({
          where: { id: entry.parentId },
        });
        if (parentEntry) {
          newParentId = parentEntry.parentId;
        }
      }
    }

    // Update the entry type and potentially parent
    const updated = await prisma.customTocEntry.update({
      where: { id: entryId },
      data: {
        type: targetType as any,
        parentId: newParentId,
      },
    });

    return NextResponse.json({ entry: updated });
  } catch (error: any) {
    console.error('[Convert TOC entry] Error:', error);
    return NextResponse.json(
      { error: 'Failed to convert entry', details: error.message },
      { status: 500 }
    );
  }
}
