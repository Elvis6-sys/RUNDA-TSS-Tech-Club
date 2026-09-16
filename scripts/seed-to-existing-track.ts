#!/usr/bin/env ts-node
/**
 * SEED TO EXISTING TRACK
 * 
 * Seeds generated content to an existing track that already has curriculum TOC
 * Usage: npm run seed-existing <EXISTING_TRACK_ID> <MODULE_CODE>
 * 
 * Example: npm run seed-existing seed-track-blockchain-fundamentals SWDBF501
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const prisma = new PrismaClient();

const GENERATED_CONTENT_DIR = path.join(__dirname, '..', 'generated-content');

interface GeneratedContent {
  moduleCode: string;
  learningOutcome: {
    number: number;
    title: string;
    performanceCriteria?: string[];
  };
  blocks: any[];
  estimatedTime: string;
  metadata: any;
}

function convertBlocksToDatabase(blocks: any[], track: any, loNumber: number) {
  /**
   * Maps blocks to curriculum TOC leaf nodes
   */
  const toc = track.tableOfContents || [];

  // Find all outcomes
  const outcomes = toc.filter((t: any) => t.type === 'outcome');

  // Get all topics
  const topics = toc.filter((t: any) => t.type === 'topic');

  // Get all subtopics
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');

  // Collect all curriculum items (leaf nodes)
  const allItems: Array<{
    id: string;
    title: string;
  }> = [];

  subtopics.forEach((sub: any) => {
    const parentTopic = topics.find((t: any) => t.id === sub.parentId);
    if (!parentTopic) return;

    const parentOutcome = outcomes.find((o: any) => o.id === parentTopic.parentId);
    if (!parentOutcome) return;

    const outIdx = outcomes.findIndex((o: any) => o.id === parentOutcome.id);
    const topicIdx = topics.findIndex((t: any) => t.id === parentTopic.id);
    const subIdx = subtopics.findIndex((s: any) => s.id === sub.id);

    if (sub.items && Array.isArray(sub.items)) {
      sub.items.forEach((itemTitle: string, itemIdx: number) => {
        const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;
        allItems.push({ id: itemId, title: itemTitle });
      });
    }
  });

  if (allItems.length === 0) {
    console.log(`   ⚠️  No curriculum items found. Using fallback key.`);
    const fallbackKey = `${blocks[0]?.id.split('-').slice(0, 2).join('-')}-t1`;
    return { [fallbackKey]: blocks };
  }

  console.log(`   📚 Found ${allItems.length} curriculum items in TOC`);

  // Distribute blocks across curriculum items
  const result: Record<string, any[]> = {};
  const blocksPerItem = Math.ceil(blocks.length / allItems.length);

  allItems.forEach((item, idx) => {
    const startIdx = idx * blocksPerItem;
    const endIdx = Math.min(startIdx + blocksPerItem, blocks.length);
    const itemBlocks = blocks.slice(startIdx, endIdx);

    if (itemBlocks.length > 0) {
      result[item.id] = itemBlocks.map(block => ({
        ...block,
        _curriculumItem: item.title,
      }));
    }
  });

  return result;
}

async function main() {
  console.log(`${'═'.repeat(60)}`);
  console.log(`🎯 SEED TO EXISTING TRACK`);
  console.log(`${'═'.repeat(60)}\n`);

  const args = process.argv.slice(2);
  const existingTrackId = args[0];
  const moduleCode = args[1]?.toUpperCase();

  if (!existingTrackId || !moduleCode) {
    console.log(`Usage: npm run seed-existing <EXISTING_TRACK_ID> <MODULE_CODE>`);
    console.log(`\nExample:`);
    console.log(`  npm run seed-existing seed-track-blockchain-fundamentals SWDBF501\n`);
    process.exit(1);
  }

  // Check track exists
  const track = await prisma.skillTrack.findUnique({
    where: { id: existingTrackId },
  });

  if (!track) {
    console.error(`❌ Track not found: ${existingTrackId}`);
    process.exit(1);
  }

  console.log(`✅ Found track: ${track.name}`);
  console.log(`📚 Track ID: ${track.id}\n`);

  // Load generated content
  const pattern = path.join(GENERATED_CONTENT_DIR, `${moduleCode}-LO*.json`);
  const files = await glob(pattern);

  if (files.length === 0) {
    console.error(`❌ No generated content found for ${moduleCode}`);
    console.log(`\n💡 First run: npm run generate ${moduleCode}\n`);
    process.exit(1);
  }

  console.log(`📖 Found ${files.length} generated learning outcomes\n`);

  const content: GeneratedContent[] = files
    .map(file => JSON.parse(fs.readFileSync(file, 'utf-8')))
    .sort((a, b) => a.learningOutcome.number - b.learningOutcome.number);

  // Seed each learning outcome
  for (const c of content) {
    const nodeId = `${track.id}-lo${c.learningOutcome.number}`;

    console.log(`📦 Seeding LO${c.learningOutcome.number}: ${c.learningOutcome.title}`);

    // Check if node exists
    const existing = await prisma.skillNode.findUnique({
      where: { id: nodeId },
    });

    const estimatedMinutes = parseInt(c.estimatedTime.split('-')[1]) || 60;
    const mappedBlocks = convertBlocksToDatabase(c.blocks, track, c.learningOutcome.number);

    if (existing) {
      await prisma.skillNode.update({
        where: { id: nodeId },
        data: {
          blocks: mappedBlocks as any,
          estimatedMinutes,
        },
      });
      console.log(`   ✅ Updated existing node`);
    } else {
      await prisma.skillNode.create({
        data: {
          id: nodeId,
          trackId: track.id,
          title: c.learningOutcome.title,
          description: c.learningOutcome.performanceCriteria?.[0] || `Learn ${c.learningOutcome.title.toLowerCase()}`,
          order: c.learningOutcome.number - 1,
          blocks: mappedBlocks as any,
          estimatedMinutes,
          videoUrl: c.blocks.find((b: any) => b.type === 'video')?.url || null,
        },
      });
      console.log(`   ✨ Created new node`);
    }

    console.log(`   📊 ${c.blocks.length} blocks → ${Object.keys(mappedBlocks).length} curriculum items\n`);
  }

  console.log(`${'═'.repeat(60)}`);
  console.log(`🎉 COMPLETE!`);
  console.log(`${'═'.repeat(60)}\n`);
  console.log(`🔗 View at: http://localhost:3001/passport/teach/${existingTrackId}\n`);
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
