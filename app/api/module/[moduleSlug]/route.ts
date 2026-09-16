/**
 * GET  /api/module/[moduleSlug]
 *   Returns the full module structure — outcomes → ICs → topics → blocks.
 *   Priority: DB (SkillNode.blocks) overrides static learnContent.ts blocks.
 *   If a topic's blocks exist in DB they replace the static ones entirely.
 *   Response also includes the track's TOC from SkillTrack.tableOfContents.
 *
 * PATCH /api/module/[moduleSlug]
 *   Trainer saves edited blocks for a specific topic back to DB.
 *   Body: { topicId: string; blocks: LearnBlock[] }
 *   Merges into SkillNode.blocks (keyed by topicId) and saves.
 *   Admin and assigned trainer only.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/local-auth";
import { getLearnModule, type LearnBlock } from "@/lib/learnContent";
import { getCallerProfile, canManageTrack } from "@/lib/trainerGuard";

// ─── GET — fetch live module content ──────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { moduleSlug: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Get static module definition
  const staticModule = getLearnModule(params.moduleSlug);

  // 2. Find DB track — PRIORITY ORDER:
  //    1. BY moduleSlug (most accurate)
  //    2. By trackName
  //    3. By module code in node title
  //    4. By slug-derived name (fuzzy)
  let track = await prisma.skillTrack.findFirst({
    where: { moduleSlug: params.moduleSlug },
    select: { id: true, name: true, tier: true, tableOfContents: true, curriculumUrl: true },
  });

  if (!track) {
    track = await prisma.skillTrack.findFirst({
      where: { name: staticModule.trackName },
      select: { id: true, name: true, tier: true, tableOfContents: true, curriculumUrl: true },
    });
  }

  if (!track) {
    // Try matching by module code in any node title
    const nodeMatch = await prisma.skillNode.findFirst({
      where: { title: { contains: staticModule.moduleCode } },
      select: { track: { select: { id: true, name: true, tier: true, tableOfContents: true, curriculumUrl: true } } },
    });
    if (nodeMatch) track = nodeMatch.track;
  }

  if (!track) {
    // Derive a readable name from the slug and fuzzy-match
    const slugName = params.moduleSlug
      .replace(/^l[345]-/, "")
      .replace(/-/g, " ")
      .replace(/\b(specific|general|ccm|modules?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    const firstWord = slugName.split(" ")[0];
    if (firstWord.length > 2) {
      track = await prisma.skillTrack.findFirst({
        where: { name: { contains: firstWord } },
        select: { id: true, name: true, tier: true, tableOfContents: true, curriculumUrl: true },
      }) ?? null;
    }
  }

  // 3. Find the primary node for this track
  //    Priority:
  //    1. Node ID matching trackId (e.g., seed-track-blockchain-fundamentals)
  //    2. Seed node at order 0
  //    3. Any node with non-empty blocks
  let node = null;
  if (track) {
    // FIRST: Try node with ID matching trackId (this holds ALL curriculum content)
    node = await prisma.skillNode.findUnique({
      where: { id: track.id },
      select: { id: true, blocks: true },
    });

    // SECOND: seed node at order 0
    if (!node) {
      node = await prisma.skillNode.findFirst({
        where: { trackId: track.id, id: { startsWith: "seed-node-" }, order: 0 },
        select: { id: true, blocks: true },
      });
    }

    // THIRD: any node with non-empty blocks
    if (!node) {
      const allNodes = await prisma.skillNode.findMany({
        where: { trackId: track.id },
        select: { id: true, blocks: true, order: true, title: true },
        orderBy: { order: "asc" },
      });
      console.log(`📍 Found ${allNodes.length} nodes for track ${track.id}:`);
      allNodes.forEach((n, idx) => {
        const blockKeys = n.blocks && typeof n.blocks === 'object' && !Array.isArray(n.blocks)
          ? Object.keys(n.blocks as any)
          : [];
        console.log(`   Node ${idx}: ${n.id} (order: ${n.order})`);
        console.log(`      Title: ${n.title}`);
        console.log(`      Blocks: ${blockKeys.length} keys`);
      });
      node = allNodes.find(n =>
        n.blocks && typeof n.blocks === "object" && !Array.isArray(n.blocks) && Object.keys(n.blocks).length > 0
      ) ?? allNodes[0] ?? null;
    }

    if (node) {
      const blockCount = node.blocks && typeof node.blocks === 'object' && !Array.isArray(node.blocks)
        ? Object.keys(node.blocks as any).length
        : 0;
      console.log(`✅ Selected node: ${node.id} with ${blockCount} block keys`);
    }
  }

  console.log('\n🔍 Node selection result:', {
    trackId: track?.id,
    nodeId: node?.id,
    hasBlocks: !!node?.blocks,
    blockKeys: node?.blocks && typeof node.blocks === 'object' && !Array.isArray(node.blocks)
      ? Object.keys(node.blocks as any)
      : [],
  });

  // 3. DB blocks shape: Record<topicId, LearnBlock[]>
  const dbBlockMap: Record<string, LearnBlock[]> =
    node?.blocks && typeof node.blocks === "object" && !Array.isArray(node.blocks)
      ? (node.blocks as Record<string, LearnBlock[]>)
      : {};

  const nodeId = node?.id ?? null;
  const dbTopicKeys = Object.keys(dbBlockMap);

  // 4. Merge blocks into module — use precise TOC-to-module mapping:
  //    The key challenge: Teacher edits using TOC structure (outcomes → topics → subtopics)
  //    but student views using static module structure (outcomes → ICs → topics).
  //    We need to map TOC subtopics to the correct static module topics by hierarchy.

  // Extract TOC structure (parse JSON if string)
  const tocData = typeof track?.tableOfContents === 'string'
    ? JSON.parse(track.tableOfContents)
    : track?.tableOfContents;
  const tocItems = (tocData as any[]) ?? [];
  const tocOutcomes = tocItems.filter((item: any) => item.type === "outcome");
  const tocTopics = tocItems.filter((item: any) => item.type === "topic");
  const tocSubtopics = tocItems.filter((item: any) => item.type === "subtopic");

  // Build a map: TOC subtopic ID → parent topic ID → parent outcome ID
  const tocHierarchy = new Map<string, { outcomeId: string; topicId: string; subtopicTitle: string }>();
  tocSubtopics.forEach((sub: any) => {
    const parentTopic = tocTopics.find((t: any) => t.id === sub.parentId);
    if (parentTopic) {
      const parentOutcome = tocOutcomes.find((o: any) => o.id === parentTopic.parentId);
      if (parentOutcome) {
        tocHierarchy.set(sub.id, {
          outcomeId: parentOutcome.id,
          topicId: parentTopic.id,
          subtopicTitle: sub.title,
        });
      }
    }
  });

  let flatIdx = 0;
  const mergedModule = {
    ...staticModule,
    outcomes: staticModule.outcomes.map((outcome, outcomeIdx) => ({
      ...outcome,
      indicativeContents: outcome.indicativeContents.map((ic) => ({
        ...ic,
        topics: ic.topics.map((topic) => {
          const n = ++flatIdx;

          // Strategy 1: Find content by matching TOC hierarchy with module structure
          // Look for a TOC subtopic that matches this topic's title and belongs to the right outcome
          // IMPORTANT: Match outcome by title/number, NOT by index position!
          const tocOutcome = tocOutcomes.find(toc =>
            toc.title === outcome.title ||
            toc.title.includes(outcome.title) ||
            outcome.title.includes(toc.title) ||
            (toc.number && toc.number === outcome.number)
          );

          if (tocOutcome) {
            // Find subtopics under this outcome that match the current topic
            // Use EXACT or VERY SPECIFIC matching to avoid false positives
            const matchingSubtopic = Array.from(tocHierarchy.entries()).find(([subId, hierarchy]) => {
              // Check if it belongs to the correct outcome first
              const belongsToOutcome = hierarchy.outcomeId === tocOutcome.id;
              if (!belongsToOutcome) return false;

              // Then check title match - be VERY specific to avoid matching multiple topics
              const topicLower = topic.title.toLowerCase().trim();
              const subtopicLower = hierarchy.subtopicTitle.toLowerCase().trim();

              // Priority 1: Exact match
              if (subtopicLower === topicLower) return true;

              // Priority 2: Subtopic title contains the FULL topic title as a substring
              // But only if the topic title is reasonably long (>10 chars) to avoid false matches
              if (topicLower.length > 10 && subtopicLower.includes(topicLower)) return true;

              // Priority 3: Topic title contains the FULL subtopic title
              if (subtopicLower.length > 10 && topicLower.includes(subtopicLower)) return true;

              return false;
            });

            if (matchingSubtopic && dbBlockMap[matchingSubtopic[0]]) {
              return { ...topic, blocks: dbBlockMap[matchingSubtopic[0]] };
            }
          }

          // Strategy 2: Exact topic ID match
          if (dbBlockMap[topic.id]) return { ...topic, blocks: dbBlockMap[topic.id] };

          // Strategy 3: nodeId-t{N} format
          if (nodeId) {
            const nodeKey = `${nodeId}-t${n}`;
            if (dbBlockMap[nodeKey]) return { ...topic, blocks: dbBlockMap[nodeKey] };
          }

          // Strategy 4: Match by exact title in any DB key
          const exactTitleMatch = dbTopicKeys.find(key => key === topic.title);
          if (exactTitleMatch && dbBlockMap[exactTitleMatch]) {
            return { ...topic, blocks: dbBlockMap[exactTitleMatch] };
          }

          return topic;
        }),
      })),
    })),
  };

  // Build a flat subtopic → DB key mapping so student page can resolve
  // trainer-saved content regardless of which key was used when saving.
  // Shape: { [topicId_in_module]: blocks[] }  (already done above via mergedModule)
  // Also expose ALL dbBlockMap keys → blocks so client can do its own resolution.

  // Build item → subtopic → blocks mapping so students can click items and see content
  // For each item in the curriculum, find the matching TOC subtopic with blocks
  const itemBlockMap: Record<string, { itemIdx: number; blocks: LearnBlock[]; subtopicId: string }[]> = {};

  console.log('🔧 Building itemBlockMap...');
  console.log('📦 Available dbBlockMap keys:', Object.keys(dbBlockMap).length);

  mergedModule.outcomes.forEach((outcome, oIdx) => {
    outcome.indicativeContents.forEach((ic, icIdx) => {
      ic.topics.forEach((topic, tIdx) => {
        const topicKey = `${oIdx}-${icIdx}-${tIdx}`;

        if (topic.items && topic.items.length > 0) {
          itemBlockMap[topicKey] = [];

          console.log(`\n📚 Processing topic: "${topic.title}" (${topicKey})`);
          console.log(`   Items: ${topic.items.length}`);

          // Match each item to its content using default-item-{oIdx}-{icIdx}-{tIdx}-{itemIdx} format
          topic.items.forEach((itemTitle, itemIdx) => {
            // Use the EXACT format from the content generator
            const itemId = `default-item-${oIdx}-${icIdx}-${tIdx}-${itemIdx}`;
            const blocks = dbBlockMap[itemId];

            if (blocks && blocks.length > 0) {
              itemBlockMap[topicKey].push({
                itemIdx,
                blocks,
                subtopicId: itemId,
              });
              console.log(`      ✅ Item "${itemTitle}" (idx ${itemIdx}): ${blocks.length} blocks`);
            } else {
              console.log(`      ❌ Item "${itemTitle}" (idx ${itemIdx}): no blocks found (key: ${itemId})`);
            }
          });
        }
      });
    });
  });

  console.log('\n📊 Final itemBlockMap:', Object.keys(itemBlockMap).length, 'topics');
  Object.entries(itemBlockMap).forEach(([key, mappings]) => {
    console.log(`   ${key}: ${mappings.length} items with content`);
  });

  // Parse tableOfContents from JSON string
  let parsedTableOfContents: any[] = [];
  if (track?.tableOfContents) {
    try {
      const parsed = typeof track.tableOfContents === 'string'
        ? JSON.parse(track.tableOfContents)
        : track.tableOfContents;
      parsedTableOfContents = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('❌ Failed to parse tableOfContents:', e);
      parsedTableOfContents = [];
    }
  }

  return NextResponse.json({
    module: mergedModule,
    trackId: track?.id ?? null,
    nodeId,
    tableOfContents: parsedTableOfContents,
    curriculumUrl: track?.curriculumUrl ?? null,
    dbTopicIds: dbTopicKeys,
    blockMap: dbBlockMap,
    itemBlockMap,  // NEW: item-level block mapping
  });
}

// ─── PATCH — trainer saves blocks for a topic ────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { moduleSlug: string } }
) {
  // Local auth
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await getCallerProfile(user.id);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staticModule = getLearnModule(params.moduleSlug);

  const body = await req.json() as {
    topicId: string;
    blocks: LearnBlock[];
    trackId?: string;  // caller can pass the known trackId directly to avoid mismatch
  };

  if (!body.topicId || !Array.isArray(body.blocks)) {
    return NextResponse.json({ error: "topicId and blocks[] required" }, { status: 400 });
  }

  // Reject keys with negative indices (client-side bug guard)
  if (body.topicId.includes('--') || body.topicId.includes('-undefined') || body.topicId.includes('-null')) {
    return NextResponse.json({ error: `Invalid topicId: ${body.topicId}` }, { status: 400 });
  }

  // Find track — prefer caller-supplied trackId, then robust slug-based lookup
  let track: { id: string } | null = null;

  if (body.trackId) {
    track = await prisma.skillTrack.findUnique({
      where: { id: body.trackId },
      select: { id: true },
    });
  }

  if (!track) {
    track = await prisma.skillTrack.findFirst({
      where: { name: staticModule.trackName },
      select: { id: true },
    });
  }

  if (!track) {
    const nodeMatch = await prisma.skillNode.findFirst({
      where: { title: { contains: staticModule.moduleCode } },
      select: { track: { select: { id: true } } },
    });
    if (nodeMatch) track = nodeMatch.track;
  }

  if (!track) {
    const slugName = params.moduleSlug
      .replace(/^l[345]-/, "")
      .replace(/-/g, " ")
      .replace(/\b(specific|general|ccm|modules?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    const firstWord = slugName.split(" ")[0];
    if (firstWord.length > 2) {
      track = await prisma.skillTrack.findFirst({
        where: { name: { contains: firstWord } },
        select: { id: true },
      }) ?? null;
    }
  }

  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

  const allowed = await canManageTrack(caller, track.id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Find the primary node — prefer seed node at order 0
  let node = await prisma.skillNode.findFirst({
    where: { trackId: track.id, id: { startsWith: "seed-node-" }, order: 0 },
    select: { id: true, blocks: true },
  });

  if (!node) {
    // Fall back to any node in track
    node = await prisma.skillNode.findFirst({
      where: { trackId: track.id },
      orderBy: { order: "asc" },
      select: { id: true, blocks: true },
    });
  }

  if (!node) {
    node = await prisma.skillNode.create({
      data: {
        trackId: track.id,
        title: `${staticModule.moduleCode} — ${staticModule.title}`,
        description: staticModule.description,
        xpReward: staticModule.xpReward,
        estimatedMinutes: staticModule.estimatedMinutes,
        order: 0,
        blocks: JSON.stringify({}),
      },
      select: { id: true, blocks: true },
    });
  }

  // Merge new blocks into existing map
  const existing: Record<string, LearnBlock[]> =
    node.blocks && typeof node.blocks === "object" && !Array.isArray(node.blocks)
      ? (node.blocks as Record<string, LearnBlock[]>)
      : {};

  // Store blocks under multiple keys to ensure they're found:
  // 1. The exact topicId passed by trainer
  // 2. If topicId looks like a TOC ID, also store under nodeId-t{N} format
  // 3. Clean version without special characters for fuzzy matching
  const updated = { ...existing, [body.topicId]: body.blocks };

  // Also store under nodeId-tN format if the topicId doesn't already look like that
  if (node.id && !body.topicId.includes(`${node.id}-t`)) {
    // Try to determine the topic index from the topicId by matching against static module
    let topicIndex = 0;
    let found = false;
    for (const outcome of staticModule.outcomes) {
      for (const ic of outcome.indicativeContents) {
        for (const topic of ic.topics) {
          topicIndex++;
          if (topic.id === body.topicId || topic.title === body.topicId) {
            updated[`${node.id}-t${topicIndex}`] = body.blocks;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
  }

  await prisma.skillNode.update({
    where: { id: node.id },
    data: { blocks: updated as object },
  });

  // 🔔 Notify all connected students immediately
  const { emitTrackChange } = await import('@/lib/trackEvents');
  emitTrackChange(track.id, 'blocks_updated');

  return NextResponse.json({ ok: true, topicId: body.topicId, blockCount: body.blocks.length });
}
