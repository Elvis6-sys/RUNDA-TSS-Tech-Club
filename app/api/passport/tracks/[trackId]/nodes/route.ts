/**
 * GET /api/passport/tracks/[trackId]/nodes
 *
 * Returns all nodes for a track with blocks.
 * Strips any bad keys (negative indices from earlier bugs).
 * Does NOT auto-remap section keys — that caused wrong content to appear
 * because position-based mapping doesn't account for custom TOC ordering.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const nodes = await prisma.skillNode.findMany({
      where: { trackId: params.trackId },
      select: { id: true, title: true, blocks: true, order: true },
      orderBy: { order: "asc" },
    });

    // Parse blocks from JSON string and strip bad keys
    const cleaned = nodes.map((node) => {
      let blocks: Record<string, any[]> = {};

      // Parse blocks if it's a JSON string
      if (node.blocks) {
        if (typeof node.blocks === 'string') {
          try {
            blocks = JSON.parse(node.blocks);
          } catch (e) {
            console.error('[nodes] Failed to parse blocks:', e);
            return { ...node, blocks: {} };
          }
        } else if (typeof node.blocks === 'object' && !Array.isArray(node.blocks)) {
          blocks = { ...(node.blocks as Record<string, any[]>) };
        }
      }

      // Strip bad keys (negative indices like default-outcome--1)
      for (const k of Object.keys(blocks)) {
        if (k.includes("--")) delete blocks[k];
      }

      console.log(`[nodes] Node ${node.id}: ${Object.keys(blocks).length} block keys - ${Object.keys(blocks).join(', ')}`);

      return { ...node, blocks };
    });

    return NextResponse.json({ nodes: cleaned });
  } catch (error) {
    console.error("Error loading track nodes:", error);
    return NextResponse.json({ nodes: [] }, { status: 500 });
  }
}
