/**
 * GET /api/toc/student/[trackId]
 * 
 * Public (auth-only) endpoint for students to poll for TOC changes.
 * Returns customTocEntries for the given track so the client can
 * detect when the teacher has modified the TOC and trigger a refresh.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from "@/lib/local-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entries = await prisma.customTocEntry.findMany({
      where: { trackId: params.trackId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        type: true,
        parentId: true,
        title: true,
        hours: true,
        order: true,
        isCustom: true,
        sourceId: true,
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('[TOC student GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
