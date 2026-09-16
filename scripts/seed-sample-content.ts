#!/usr/bin/env ts-node
/**
 * AUTOMATED CONTENT SEEDER
 * 
 * This script takes the sample SWDML501-LO1 content and:
 * 1. Creates/finds the track in database
 * 2. Creates SkillNode with proper TOC structure
 * 3. Inserts all 25 content blocks
 * 4. Makes it visible in teacher interface
 * 
 * Run: npx ts-node scripts/seed-sample-content.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SAMPLE_FILE = path.join(__dirname, '..', 'SAMPLE_MINIMAL.json');
const TIER = 'L5';
const TRACK_NAME = 'machine-learning-application';
const TRACK_DESCRIPTION = 'Learn to build machine learning applications with Python, covering data preprocessing, model development, and deployment.';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function generateTrackId(moduleName: string): string {
  return `seed-track-${moduleName.toLowerCase().replace(/\s+/g, '-')}`;
}

function generateNodeId(trackId: string, loNumber: number): string {
  return `${trackId}-lo${loNumber}`;
}

async function loadSampleContent() {
  console.log(`📖 Loading sample content from: ${SAMPLE_FILE}`);

  if (!fs.existsSync(SAMPLE_FILE)) {
    throw new Error(`Sample file not found: ${SAMPLE_FILE}`);
  }

  const content = JSON.parse(fs.readFileSync(SAMPLE_FILE, 'utf-8'));
  console.log(`✅ Loaded content for ${content.moduleCode} - LO${content.learningOutcome.number}`);
  return content;
}

function buildTableOfContents(loNumber: number, loTitle: string, blocks: any[]) {
  /**
   * Builds hierarchical TOC from content blocks
   * Structure: Learning Outcome → Sections → Topics
   */

  const sections: any[] = [];
  let currentSection: any = null;

  // Group blocks into sections based on headers
  for (const block of blocks) {
    if (block.type === 'text' && block.content.startsWith('## ')) {
      // New section (h2 heading)
      const sectionTitle = block.content.split('\n')[0].replace('## ', '').trim();

      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        id: `section-${sections.length + 1}`,
        title: sectionTitle,
        blocks: [block.id],
        subsections: []
      };
    } else if (block.type === 'text' && block.content.startsWith('### ')) {
      // Subsection (h3 heading)
      if (currentSection) {
        const subsectionTitle = block.content.split('\n')[0].replace('### ', '').trim();
        currentSection.subsections.push({
          id: `subsection-${currentSection.subsections.length + 1}`,
          title: subsectionTitle,
          blocks: [block.id]
        });
      }
    } else {
      // Add to current section
      if (currentSection) {
        currentSection.blocks.push(block.id);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Build final TOC
  return [
    {
      id: `lo${loNumber}`,
      title: `Learning Outcome ${loNumber}: ${loTitle}`,
      order: loNumber - 1,
      sections: sections.map((s, i) => ({
        id: s.id,
        title: s.title,
        order: i,
        blockIds: s.blocks,
        subsections: s.subsections.map((sub: any, j: number) => ({
          id: sub.id,
          title: sub.title,
          order: j,
          blockIds: sub.blocks
        }))
      }))
    }
  ];
}

function convertBlocksToDatabase(blocks: any[]) {
  /**
   * Converts sample JSON blocks to database format
   * Organizes by topic ID for LearnModuleReader
   */

  const topicBlocks: Record<string, any[]> = {};
  const topicId = `${blocks[0]?.id.split('-')[0]}-t1`; // e.g., "swdml501-lo1-t1"

  topicBlocks[topicId] = blocks.map(block => ({
    ...block,
    // Ensure all required fields are present
    id: block.id || `blk-${Math.random().toString(36).substr(2, 9)}`,
    type: block.type || 'text',
  }));

  return topicBlocks;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEEDING LOGIC
// ═══════════════════════════════════════════════════════════════════════════

async function seedTrack(content: any) {
  // Use the fixed track ID that matches the user's URL
  const trackId = 'seed-track-machine-learning-application';

  console.log(`\n🎯 Seeding Track: ${trackId}`);

  // Check if track exists
  let track = await prisma.skillTrack.findUnique({
    where: { id: trackId }
  });

  if (track) {
    console.log(`✅ Track already exists: ${track.name}`);
  } else {
    // Create new track
    track = await prisma.skillTrack.create({
      data: {
        id: trackId,
        name: `${content.moduleCode} - Machine Learning Application`,
        description: TRACK_DESCRIPTION,
        tier: TIER,
        icon: '🤖', // Machine Learning emoji
        tableOfContents: [],
      }
    });

    console.log(`✨ Created new track: ${track.name}`);
  }

  return track;
}

async function seedSkillNode(track: any, content: any) {
  // Use the fixed node ID that matches the track
  const nodeId = 'seed-track-machine-learning-application-lo1';

  console.log(`\n📦 Seeding SkillNode: ${nodeId}`);

  // Check if node exists
  let node = await prisma.skillNode.findUnique({
    where: { id: nodeId }
  });

  if (node) {
    console.log(`⚠️  Node already exists. Updating...`);

    // Update existing node
    node = await prisma.skillNode.update({
      where: { id: nodeId },
      data: {
        title: content.learningOutcome.title,
        description: `Learn ${content.learningOutcome.title.toLowerCase()} with interactive examples, quizzes, and real-world applications.`,
        blocks: convertBlocksToDatabase(content.blocks),
        estimatedMinutes: parseInt(content.estimatedTime.split('-')[1]) || 60,
        videoUrl: content.blocks.find((b: any) => b.type === 'video')?.url || null,
      }
    });

    console.log(`✅ Updated node: ${node.title}`);
  } else {
    // Create new node
    node = await prisma.skillNode.create({
      data: {
        id: nodeId,
        trackId: track.id,
        title: content.learningOutcome.title,
        description: `Learn ${content.learningOutcome.title.toLowerCase()} with interactive examples, quizzes, and real-world applications.`,
        order: content.learningOutcome.number - 1,
        blocks: convertBlocksToDatabase(content.blocks),
        estimatedMinutes: parseInt(content.estimatedTime.split('-')[1]) || 60,
        videoUrl: content.blocks.find((b: any) => b.type === 'video')?.url || null,
      }
    });

    console.log(`✨ Created new node: ${node.title}`);
  }

  return node;
}

async function updateTrackTOC(track: any, content: any) {
  console.log(`\n📋 Updating Track Table of Contents...`);

  const toc = buildTableOfContents(
    content.learningOutcome.number,
    content.learningOutcome.title,
    content.blocks
  );

  await prisma.skillTrack.update({
    where: { id: track.id },
    data: {
      tableOfContents: toc
    }
  });

  console.log(`✅ TOC updated with ${toc[0].sections.length} sections`);

  // Print TOC structure
  console.log(`\n📖 Table of Contents Structure:`);
  toc[0].sections.forEach((section: any, i: number) => {
    console.log(`   ${i + 1}. ${section.title} (${section.blockIds.length} blocks)`);
    section.subsections?.forEach((sub: any, j: number) => {
      console.log(`      ${i + 1}.${j + 1}. ${sub.title} (${sub.blockIds.length} blocks)`);
    });
  });
}

async function printSummary(track: any, node: any, content: any) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎉 SEEDING COMPLETE!`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Track: ${track.name}`);
  console.log(`   • Node: ${node.title}`);
  console.log(`   • Blocks: ${content.blocks.length} content blocks`);
  console.log(`   • Interactive Elements: ${content.metadata.interactiveElements}`);
  console.log(`   • Estimated Time: ${content.estimatedTime}`);

  console.log(`\n🔗 Access URLs:`);
  console.log(`   • Teacher View: http://localhost:3001/passport/teach/seed/${track.id}`);
  console.log(`   • Student View: http://localhost:3001/learn/${track.id}/${node.id}`);
  console.log(`   • TOC Editor: http://localhost:3001/passport/tracks/${track.id}/curriculum`);

  console.log(`\n✨ Content Types:`);
  const typeCounts = content.blocks.reduce((acc: any, block: any) => {
    acc[block.type] = (acc[block.type] || 0) + 1;
    return acc;
  }, {});

  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   • ${type}: ${count}`);
  });

  console.log(`\n${'═'.repeat(60)}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`${'═'.repeat(60)}`);
  console.log(`🚀 AUTOMATED CONTENT SEEDER`);
  console.log(`   Sample: SWDML501 - Learning Outcome 1`);
  console.log(`${'═'.repeat(60)}\n`);

  try {
    // 1. Load sample content
    const content = await loadSampleContent();

    // 2. Seed track (or find existing)
    const track = await seedTrack(content);

    // 3. Seed skill node with blocks
    const node = await seedSkillNode(track, content);

    // 4. Update track TOC
    await updateTrackTOC(track, content);

    // 5. Print summary
    await printSummary(track, node, content);

    console.log(`✅ SUCCESS! Content is now live in the system.`);
    console.log(`   Open the Teacher View URL to see it in action!\n`);

  } catch (error) {
    console.error(`\n❌ ERROR:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as seedSampleContent };
