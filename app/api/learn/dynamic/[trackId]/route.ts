import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Dynamic Learning API - Serves content from SkillNode.blocks
 * 
 * This endpoint bridges the gap between:
 * 1. AI-generated content stored in SkillNode.blocks
 * 2. Student LearnModuleReader expecting module format
 * 
 * URL: /api/learn/dynamic/[trackId]
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const { trackId } = params;

    // Get track with TOC
    const track = await prisma.skillTrack.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        name: true,
        description: true,
        tableOfContents: true,
        moduleSlug: true,
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    // Get all nodes with blocks
    const nodes = await prisma.skillNode.findMany({
      where: { trackId },
      select: {
        id: true,
        title: true,
        description: true,
        blocks: true,
        order: true,
        estimatedMinutes: true,
      },
      orderBy: { order: "asc" },
    });

    // Combine all blocks from all nodes
    const allBlocks: Record<string, any[]> = {};
    nodes.forEach((node) => {
      if (node.blocks && typeof node.blocks === "object") {
        Object.entries(node.blocks).forEach(([key, blocks]) => {
          allBlocks[key] = blocks as any[];
        });
      }
    });

    // Convert to LearnModule format expected by student interface
    // Parse tableOfContents from JSON string
    let toc: any[] = [];
    if (track.tableOfContents) {
      try {
        const parsed = typeof track.tableOfContents === 'string'
          ? JSON.parse(track.tableOfContents)
          : track.tableOfContents;
        toc = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse tableOfContents:', e);
        toc = [];
      }
    }

    const outcomes = toc.filter((t: any) => t.type === "outcome");
    const topics = toc.filter((t: any) => t.type === "topic");
    const subtopics = toc.filter((t: any) => t.type === "subtopic");

    const module = {
      id: track.id,
      slug: track.id,
      title: track.name,
      description: track.description || "",
      tier: "l5",
      version: "1.0",
      outcomes: outcomes.map((outcome: any, outIdx: number) => ({
        id: outcome.id,
        title: outcome.title,
        description: outcome.description || "",
        estimatedMinutes: outcome.hours ? outcome.hours * 60 : 120,
        indicativeContents: topics
          .filter((t: any) => t.parentId === outcome.id)
          .map((topic: any, topicIdx: number) => ({
            id: topic.id,
            title: topic.title,
            description: topic.description || "",
            topics: subtopics
              .filter((s: any) => s.parentId === topic.id)
              .map((subtopic: any, subIdx: number) => {
                // Get blocks for this subtopic and its items
                const subtopicBlocks: any[] = [];

                // If subtopic has items, collect blocks for each item
                if (subtopic.items && Array.isArray(subtopic.items)) {
                  subtopic.items.forEach((itemTitle: string, itemIdx: number) => {
                    const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;
                    const itemBlocks = allBlocks[itemId] || [];
                    subtopicBlocks.push(...itemBlocks);
                  });
                }

                // Also check for subtopic-level blocks
                const directBlocks = allBlocks[subtopic.id] || [];
                subtopicBlocks.push(...directBlocks);

                return {
                  id: subtopic.id,
                  title: subtopic.title,
                  description: subtopic.description || "",
                  estimatedMinutes: 15,
                  blocks: subtopicBlocks,
                };
              }),
          })),
      })),
    };

    return NextResponse.json({
      module,
      blockMap: allBlocks,
      nodeId: nodes[0]?.id,
      source: "dynamic",
    });
  } catch (error) {
    console.error("Error loading dynamic content:", error);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }
}
