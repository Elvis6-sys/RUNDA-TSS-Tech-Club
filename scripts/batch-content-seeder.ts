#!/usr/bin/env ts-node
/**
 * BATCH CONTENT SEEDER
 * 
 * Reads generated content from ai-content-generator and:
 * 1. Creates SkillTracks for each module
 * 2. Creates SkillNodes for each learning outcome
 * 3. Builds proper TOC hierarchy
 * 4. Links content to curriculum structure
 * 5. Makes everything visible in teacher interface
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

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

interface CurriculumModule {
  code: string;
  title: string;
  level: string;
  department: string;
  learningOutcomes: any[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const GENERATED_CONTENT_DIR = path.join(__dirname, '..', 'generated-content');
const CURRICULUM_FILE = path.join(__dirname, '..', 'lib', 'curriculum-data', 'curriculum-all.json');

// Department icons
const DEPT_ICONS: Record<string, string> = {
  'Software Development': '💻',
  'Land Surveying': '🗺️',
  'Computer System and Architecture': '🖥️',
  'Building Construction': '🏗️',
};

// Tier colors
const TIER_COLORS: Record<string, string> = {
  'L4': 'from-blue-500 to-cyan-500',
  'L5': 'from-purple-500 to-pink-500',
  'L6': 'from-orange-500 to-red-500',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function generateTrackId(moduleCode: string): string {
  return `track-${moduleCode.toLowerCase()}`;
}

function generateNodeId(trackId: string, loNumber: number): string {
  return `${trackId}-lo${loNumber}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function convertBlocksToDatabase(blocks: any[], track: any, loNumber: number) {
  /**
   * Converts generated blocks to database format
   * Maps blocks to curriculum TOC leaf nodes (items under subtopics)
   */

  // Get curriculum TOC from track
  const toc = track.tableOfContents || [];

  // Find the learning outcome in TOC
  const outcomes = toc.filter((t: any) => t.type === 'outcome');
  const currentOutcome = outcomes.find((o: any) =>
    o.title?.toLowerCase().includes(blocks[0]?.id?.split('-')[1] || '') ||
    outcomes.indexOf(o) === (loNumber - 1)
  ) || outcomes[loNumber - 1];

  if (!currentOutcome) {
    // Fallback: use simple topic key if no TOC structure
    const topicId = `${blocks[0]?.id.split('-').slice(0, 2).join('-')}-t1`;
    return { [topicId]: blocks };
  }

  // Get all topics under this outcome
  const topics = toc.filter((t: any) =>
    t.type === 'topic' && t.parentId === currentOutcome.id
  );

  // Get all subtopics under these topics
  const subtopics = toc.filter((t: any) =>
    t.type === 'subtopic' && topics.some((topic: any) => topic.id === t.parentId)
  );

  // Collect all curriculum items (leaf nodes)
  const allItems: Array<{
    id: string;
    title: string;
    outIdx: number;
    topicIdx: number;
    subIdx: number;
    itemIdx: number;
  }> = [];

  subtopics.forEach((sub: any) => {
    const parentTopic = topics.find((t: any) => t.id === sub.parentId);
    if (!parentTopic) return;

    const outIdx = outcomes.findIndex((o: any) => o.id === currentOutcome.id);
    const topicIdx = topics.findIndex((t: any) => t.id === parentTopic.id);
    const subIdx = subtopics.findIndex((s: any) => s.id === sub.id);

    if (sub.items && Array.isArray(sub.items)) {
      // Subtopic has curriculum items
      sub.items.forEach((itemTitle: string, itemIdx: number) => {
        const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`;
        allItems.push({
          id: itemId,
          title: itemTitle,
          outIdx,
          topicIdx,
          subIdx,
          itemIdx,
        });
      });
    } else {
      // Subtopic itself is an item
      const itemId = `default-item-${outIdx}-${topicIdx}-${subIdx}-0`;
      allItems.push({
        id: itemId,
        title: sub.title,
        outIdx,
        topicIdx,
        subIdx,
        itemIdx: 0,
      });
    }
  });

  if (allItems.length === 0) {
    // No curriculum items found, use fallback
    const topicId = `${blocks[0]?.id.split('-').slice(0, 2).join('-')}-t1`;
    return { [topicId]: blocks };
  }

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
        // Add context about which curriculum item this belongs to
        _curriculumItem: item.title,
      }));
    }
  });

  return result;
}

function buildTOCFromContent(content: GeneratedContent[]): any[] {
  /**
   * Builds hierarchical TOC structure from generated content
   * Structure: Learning Outcomes → Sections (from block headers)
   */
  return content.map((c, idx) => ({
    id: `lo-${c.learningOutcome.number}`,
    type: 'outcome',
    title: c.learningOutcome.title,
    order: idx,
    hours: parseInt(c.estimatedTime.split('-')[1]) / 60 || 1,
    performanceCriteria: c.learningOutcome.performanceCriteria || [],
    sections: extractSections(c.blocks, c.moduleCode, c.learningOutcome.number),
  }));
}

function extractSections(blocks: any[], moduleCode: string, loNumber: number) {
  /**
   * Extracts sections from content blocks based on ## headers
   */
  const sections: any[] = [];
  let currentSection: any = null;

  for (const block of blocks) {
    if (block.type === 'text' && block.content?.includes('## ')) {
      const lines = block.content.split('\n');
      const headerLine = lines.find((l: string) => l.startsWith('## '));

      if (headerLine) {
        const title = headerLine.replace('## ', '').trim();

        if (currentSection) {
          sections.push(currentSection);
        }

        currentSection = {
          id: `${moduleCode.toLowerCase()}-lo${loNumber}-s${sections.length + 1}`,
          title,
          blockIds: [block.id],
          subsections: [],
        };
      }
    } else if (currentSection) {
      currentSection.blockIds.push(block.id);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections found, create a default one
  if (sections.length === 0) {
    sections.push({
      id: `${moduleCode.toLowerCase()}-lo${loNumber}-s1`,
      title: 'Content',
      blockIds: blocks.map(b => b.id),
      subsections: [],
    });
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function seedTrack(module: CurriculumModule, content: GeneratedContent[]) {
  const trackId = generateTrackId(module.code);

  console.log(`\n🎯 Seeding Track: ${trackId}`);

  // Check if track exists
  const existingTrack = await prisma.skillTrack.findUnique({
    where: { id: trackId },
  });

  // Build TOC from curriculum structure (not from generated content)
  const toc = module.learningOutcomes.map((lo, idx) => ({
    id: `lo-${lo.number}`,
    type: 'outcome',
    title: lo.title,
    order: idx,
    hours: 10,
    performanceCriteria: lo.performanceCriteria || [],
    topics: (lo as any).topics || [],
  }));

  let track: any;

  if (existingTrack) {
    // Update existing track - preserve existing TOC if it has curriculum structure
    const hasExistingCurriculumTOC = existingTrack.tableOfContents &&
      Array.isArray(existingTrack.tableOfContents) &&
      (existingTrack.tableOfContents as any[]).some((item: any) =>
        item.type === 'topic' || item.type === 'subtopic'
      );

    track = await prisma.skillTrack.update({
      where: { id: trackId },
      data: {
        ...(hasExistingCurriculumTOC ? {} : { tableOfContents: toc as any }),
      },
    });
    console.log(`✅ Updated existing track: ${track.name}`);
    console.log(`   📚 TOC: ${hasExistingCurriculumTOC ? 'Preserved curriculum structure' : 'Created from LOs'}`);
  } else {
    // Create new track
    track = await prisma.skillTrack.create({
      data: {
        id: trackId,
        name: `${module.code} - ${module.title}`,
        description: `Complete ${module.title} curriculum with ${content.length} learning outcomes. Interactive lessons, quizzes, and hands-on exercises.`,
        tier: module.level,
        icon: DEPT_ICONS[module.department] || '📚',
        order: 0,
        tableOfContents: toc as any,
      },
    });
    console.log(`✨ Created new track: ${track.name}`);
  }

  // Re-fetch to get latest TOC
  const finalTrack = await prisma.skillTrack.findUnique({
    where: { id: trackId },
  });

  return finalTrack;
}

async function seedSkillNodes(track: any, content: GeneratedContent[]) {
  console.log(`\n📦 Seeding ${content.length} SkillNodes...`);

  for (const c of content) {
    const nodeId = generateNodeId(track.id, c.learningOutcome.number);

    // Check if node exists
    const existing = await prisma.skillNode.findUnique({
      where: { id: nodeId },
    });

    const estimatedMinutes = parseInt(c.estimatedTime.split('-')[1]) || 60;

    // Convert blocks with proper TOC mapping
    const mappedBlocks = convertBlocksToDatabase(c.blocks, track, c.learningOutcome.number);
    const totalMappedBlocks = Object.values(mappedBlocks).flat().length;

    if (existing) {
      // Update existing node
      await prisma.skillNode.update({
        where: { id: nodeId },
        data: {
          blocks: mappedBlocks as any,
          estimatedMinutes,
        },
      });
      console.log(`   ✅ Updated LO${c.learningOutcome.number}: ${c.learningOutcome.title}`);
      console.log(`      📊 ${c.blocks.length} blocks → ${Object.keys(mappedBlocks).length} curriculum items`);
    } else {
      // Create new node
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
      console.log(`   ✨ Created LO${c.learningOutcome.number}: ${c.learningOutcome.title}`);
      console.log(`      📊 ${c.blocks.length} blocks → ${Object.keys(mappedBlocks).length} curriculum items`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

async function seedModuleContent(moduleCode: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📚 Seeding Module: ${moduleCode}`);
  console.log(`${'═'.repeat(60)}`);

  // Load curriculum metadata
  const curriculumData = JSON.parse(fs.readFileSync(CURRICULUM_FILE, 'utf-8'));

  // Extract modules from all levels
  const modules: CurriculumModule[] = [];
  ['L3', 'L4', 'L5'].forEach(level => {
    if (curriculumData[level] && Array.isArray(curriculumData[level])) {
      curriculumData[level].forEach((mod: any) => {
        if (mod.code && mod.learningOutcomes) {
          modules.push({
            code: mod.code,
            title: mod.title,
            level: level,
            department: mod.moduleType || 'General',
            learningOutcomes: mod.learningOutcomes,
          });
        }
      });
    }
  });

  const module = modules.find(m => m.code === moduleCode);
  if (!module) {
    throw new Error(`Module ${moduleCode} not found in curriculum`);
  }

  // Load all generated content files for this module
  const pattern = path.join(GENERATED_CONTENT_DIR, `${moduleCode}-LO*.json`);
  const files = glob.sync(pattern);

  if (files.length === 0) {
    throw new Error(`No generated content found for ${moduleCode} in ${GENERATED_CONTENT_DIR}`);
  }

  console.log(`\n📖 Found ${files.length} generated learning outcomes`);

  const content: GeneratedContent[] = files
    .map(file => JSON.parse(fs.readFileSync(file, 'utf-8')))
    .sort((a, b) => a.learningOutcome.number - b.learningOutcome.number);

  // Seed to database
  const track = await seedTrack(module, content);
  await seedSkillNodes(track, content);

  return { track, content };
}

async function seedAllModules() {
  const files = glob.sync(path.join(GENERATED_CONTENT_DIR, '*-LO*.json'));

  if (files.length === 0) {
    console.error(`❌ No generated content found in ${GENERATED_CONTENT_DIR}`);
    console.log(`\n💡 First run: npx ts-node scripts/ai-content-generator.ts <MODULE_CODE>`);
    process.exit(1);
  }

  // Extract unique module codes
  const moduleCodes = new Set<string>();
  files.forEach(file => {
    const filename = path.basename(file);
    const match = filename.match(/^([A-Z]+\d+)-LO/);
    if (match) {
      moduleCodes.add(match[1]);
    }
  });

  console.log(`\n📚 Found content for ${moduleCodes.size} modules`);
  console.log(`   Modules: ${Array.from(moduleCodes).join(', ')}\n`);

  const results = [];

  for (const moduleCode of Array.from(moduleCodes)) {
    try {
      const result = await seedModuleContent(moduleCode);
      results.push(result);
    } catch (error: any) {
      console.error(`\n❌ Failed to seed ${moduleCode}:`, error.message);
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`${'═'.repeat(60)}`);
  console.log(`🚀 BATCH CONTENT SEEDER`);
  console.log(`   Uploading AI-generated content to database`);
  console.log(`${'═'.repeat(60)}`);

  const args = process.argv.slice(2);
  const moduleCode = args[0]?.toUpperCase();

  let results;

  if (moduleCode) {
    // Seed specific module
    const result = await seedModuleContent(moduleCode);
    results = [result];
  } else {
    // Seed all modules
    results = await seedAllModules();
  }

  // Print summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎉 SEEDING COMPLETE`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Modules Seeded: ${results.length}`);
  console.log(`   • Total Learning Outcomes: ${results.reduce((sum, r) => sum + r.content.length, 0)}`);
  console.log(`   • Total Content Blocks: ${results.reduce((sum, r) => sum + r.content.reduce((s: number, c: any) => s + c.blocks.length, 0), 0)}`);

  console.log(`\n🔗 Access URLs:`);
  results.forEach(r => {
    if (!r || !r.track) return;
    const trackId = generateTrackId(r.content[0]?.moduleCode || '');
    console.log(`   • ${r.track.name}:`);
    console.log(`     Teacher: http://localhost:3001/passport/teach/${trackId}`);
    console.log(`     Student: http://localhost:3001/learn/${trackId}/${generateNodeId(trackId, 1)}`);
  });

  console.log(`\n✨ Content is now live in the system!\n`);
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
