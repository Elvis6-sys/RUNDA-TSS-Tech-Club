/**
 * POST /api/passport/tracks/[trackId]/nodes/save-blocks
 *
 * Saves blocks for a given topicId into the first SkillNode of the track.
 * Works for ALL tracks regardless of whether they have a moduleSlug.
 *
 * Body: { topicId: string; blocks: any[] }
 *
 * This is the preferred save path — it replaces the PATCH /api/module/[slug]
 * route when the teacher is working on a DB-driven track.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from "@/lib/local-auth";
import { getCallerProfile, canManageTrack } from '@/lib/trainerGuard';
import { emitTrackChange } from '@/lib/trackEvents';

export async function POST(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    // Local auth
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = await getCallerProfile(user.id);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowed = await canManageTrack(caller, params.trackId);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json() as { topicId: string; blocks: any[] };
    if (!body.topicId || !Array.isArray(body.blocks)) {
      return NextResponse.json({ error: 'topicId and blocks[] required' }, { status: 400 });
    }

    if (body.topicId.includes('--') || body.topicId.includes('-undefined') || body.topicId.includes('-null')) {
      return NextResponse.json({ error: `Invalid topicId: ${body.topicId}` }, { status: 400 });
    }

    let node = await prisma.skillNode.findFirst({
      where: { trackId: params.trackId },
      orderBy: { order: 'asc' },
      select: { id: true, blocks: true },
    });

    if (!node) {
      const track = await prisma.skillTrack.findUnique({
        where: { id: params.trackId },
        select: { name: true },
      });
      node = await prisma.skillNode.create({
        data: {
          trackId: params.trackId,
          title: track?.name ?? 'Module',
          order: 0,
          xpReward: 10,
          estimatedMinutes: 30,
          blocks: JSON.stringify({}),
        },
        select: { id: true, blocks: true },
      });
    }

    // Parse existing blocks (blocks is stored as JSON string)
    let existing: Record<string, any[]> = {};
    if (node.blocks) {
      if (typeof node.blocks === 'string') {
        try {
          existing = JSON.parse(node.blocks);
        } catch (e) {
          console.error('[save-blocks] Failed to parse existing blocks:', e);
        }
      } else if (typeof node.blocks === 'object' && !Array.isArray(node.blocks)) {
        existing = node.blocks as Record<string, any[]>;
      }
    }

    const updated = { ...existing, [body.topicId]: body.blocks };

    await prisma.skillNode.update({
      where: { id: node.id },
      data: { blocks: JSON.stringify(updated) },
    });

    // 🔔 Notify all connected students immediately
    emitTrackChange(params.trackId, 'blocks_updated');

    return NextResponse.json({
      ok: true,
      topicId: body.topicId,
      blockCount: body.blocks.length,
      nodeId: node.id,
    });
  } catch (error) {
    console.error('[save-blocks] Error:', error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
