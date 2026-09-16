import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCallerProfile } from '@/lib/trainerGuard';
import { getCurrentUser } from "@/lib/local-auth";
import { emitTrackChange } from '@/lib/trackEvents';

// GET /api/toc/[trackId] - Get custom TOC entries for a track
export async function GET(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = await getCallerProfile(user.id);
    if (!caller || !['trainer', 'admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { trackId } = params;

    // Fetch all custom TOC entries for this track
    const entries = await prisma.customTocEntry.findMany({
      where: { trackId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('[TOC GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TOC entries' },
      { status: 500 }
    );
  }
}

// POST /api/toc/[trackId] - Create a new TOC entry
export async function POST(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = await getCallerProfile(user.id);
    if (!caller || !['trainer', 'admin'].includes(caller.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { trackId } = params;
    const body = await req.json();
    const { type, parentId, title, description, hours, order, replaceDefaultId } = body;

    // Validate required fields
    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      );
    }

    // Create the entry
    const entry = await prisma.customTocEntry.create({
      data: {
        trackId,
        trainerId: caller.id,
        type,
        parentId: parentId || null,
        title,
        description: description || null,
        hours: hours || null,
        order: order || 0,
        isCustom: true,
        sourceId: replaceDefaultId || null, // Link to default entry this replaces
      },
    });

    // 🔔 Notify students instantly
    emitTrackChange(trackId, 'entry_updated');

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('[TOC POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create TOC entry' },
      { status: 500 }
    );
  }
}