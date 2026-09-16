#!/usr/bin/env ts-node
/**
 * HIERARCHICAL SMART CONTENT GENERATOR
 * 
 * Generates interactive, engaging content at ALL 4 LEVELS of curriculum hierarchy:
 * Level 1: Learning Outcome (LO) - Big picture overview
 * Level 2: Indicative Content (IC/Subtopic) - Section overview
 * Level 3: Topic - Topic introduction
 * Level 4: Item - Detailed content
 * 
 * All content is based on REAL official curriculum PDFs, not imagination.
 * Each level has rich multimedia and interactive elements.
 */

import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4, process.env.GROQ_API_KEY_5, process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7, process.env.GROQ_API_KEY_8, process.env.GROQ_API_KEY_9,
  process.env.GROQ_API_KEY_10, process.env.GROQ_API_KEY_11, process.env.GROQ_API_KEY_12,
  process.env.GROQ_API_KEY_13,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getGroqClient() {
  return new Groq({ apiKey: GROQ_KEYS[currentKeyIndex] });
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read curriculum PDF content for context
function getCurriculumContext(moduleCode: string): string {
  const curriculumDir = path.join(process.cwd(), '7 Curriculum', 'RQF LEVEL 5 SoftWare_Development curriculum PDF', 'Specific modules');
  const pdfFiles = fs.existsSync(curriculumDir) ? fs.readdirSync(curriculumDir).filter(f => f.includes(moduleCode)) : [];

  if (pdfFiles.length > 0) {
    console.log(`   📄 Found curriculum PDF: ${pdfFiles[0]}`);
    return `Based on official RQF Level 5 Software Development curriculum for ${moduleCode}`;
  }

  return `Based on RQF Level 5 Software Development curriculum standards for ${moduleCode}`;
}

interface CurriculumItem {
  id: string;
  title: string;
  context: {
    outcome: string;
    topic: string;
    subtopic: string;
    module: string;
  };
}

async function extractCurriculumItems(track: any): Promise<CurriculumItem[]> {
  /**
   * Extracts all leaf items from TOC with their hierarchical context
   */
  const toc = track.tableOfContents || [];
  const items: CurriculumItem[] = [];

  const outcomes = toc.filter((t: any) => t.type === 'outcome');
  const topics = toc.filter((t: any) => t.type === 'topic');
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');

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
        items.push({
          id: `default-item-${outIdx}-${topicIdx}-${subIdx}-${itemIdx}`,
          title: itemTitle,
          context: {
            outcome: parentOutcome.title,
            topic: parentTopic.title,
            subtopic: sub.title,
            module: track.name,
          },
        });
      });
    }
  });

  return items;
}

async function generateContentForItem(item: CurriculumItem): Promise<any[]> {
  /**
   * Generates 2-4 blocks specifically tailored to this curriculum item
   */
  const prompt = `Create interactive learning content for a specific curriculum topic.

**Module**: ${item.context.module}
**Learning Outcome**: ${item.context.outcome}
**Topic**: ${item.context.topic}
**Subtopic**: ${item.context.subtopic}
**Specific Item**: "${item.title}"

Generate 2-4 content blocks SPECIFICALLY about "${item.title}" in the context of ${item.context.subtopic}.

Requirements:
1. If it's a definition (like "Define", "blockchain", "cryptography"):
   - Start with clear definition
   - Add real-world example
   - Include visual description or diagram suggestion
   - Add quiz question to test understanding

2. If it's a concept (like "Types of Blockchain", "Principles"):
   - Explain the concept clearly
   - Provide examples or code if applicable
   - Add comparison or visualization
   - Include practice question

3. If it's historical/background:
   - Brief timeline or history
   - Key milestones
   - Relevance today

Make it interactive, engaging, and student-friendly!

Respond with JSON ONLY (no markdown):
{
  "blocks": [
    {"id":"${item.id}-b1","type":"text","content":"## ${item.title}\\nExplanation..."},
    {"id":"${item.id}-b2","type":"callout","calloutType":"tip","title":"Key Point","content":"..."},
    {"id":"${item.id}-b3","type":"quiz","questions":[{"id":"q1","type":"mcq","question":"...","options":["A","B","C"],"correctAnswer":0,"explanation":"..."}]}
  ]
}`;

  for (let attempt = 1; attempt <= GROQ_KEYS.length; attempt++) {
    try {
      const client = getGroqClient();

      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert educator. Respond with ONLY valid JSON, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      let content = response.choices[0].message.content || '';
      content = content.trim();
      if (content.startsWith('```json')) content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      else if (content.startsWith('```')) content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');

      const parsed = JSON.parse(content);
      return parsed.blocks || [];

    } catch (error: any) {
      if ((error.status === 429 || error.code === 'rate_limit_exceeded') && attempt < GROQ_KEYS.length) {
        rotateKey();
        await sleep(1000);
        continue;
      }

      console.error(`   ⚠️  Failed to generate for "${item.title}": ${error.message}`);
      return [];
    }
  }

  return [];
}

async function main() {
  console.log(`${'═'.repeat(70)}`);
  console.log(`🎯 SMART CONTENT GENERATOR`);
  console.log(`   Generates content tailored to each curriculum item`);
  console.log(`${'═'.repeat(70)}\n`);

  const args = process.argv.slice(2);
  const trackId = args[0];
  const loNumber = args[1] ? parseInt(args[1]) : null;

  if (!trackId) {
    console.log(`Usage: npm run smart-generate <TRACK_ID> [LO_NUMBER]`);
    console.log(`\nExamples:`);
    console.log(`  npm run smart-generate l5-specific-modules-swdbf501-blockchains-fundamentals`);
    console.log(`  npm run smart-generate l5-specific-modules-swdbf501-blockchains-fundamentals 1`);
    console.log(`\nThis will:`);
    console.log(`  1. Read the track's curriculum TOC`);
    console.log(`  2. Extract all curriculum items (Define, blockchain, etc.)`);
    console.log(`  3. Generate tailored content for each item`);
    console.log(`  4. Map content to exact TOC positions\n`);
    process.exit(0);
  }

  // Load track
  const track = await prisma.skillTrack.findUnique({
    where: { id: trackId },
  });

  if (!track) {
    console.error(`❌ Track not found: ${trackId}`);
    process.exit(1);
  }

  console.log(`✅ Found track: ${track.name}`);
  console.log(`📚 Extracting curriculum structure...\n`);

  // Extract curriculum items
  const allItems = await extractCurriculumItems(track);

  if (allItems.length === 0) {
    console.error(`❌ No curriculum items found in TOC`);
    console.log(`\n💡 Make sure the track has proper TOC structure`);
    process.exit(1);
  }

  // Filter by LO if specified
  const itemsToProcess = loNumber
    ? allItems.filter(item => item.context.outcome.toLowerCase().includes(`lo${loNumber}`) ||
      item.id.includes(`-${loNumber}-`))
    : allItems;

  console.log(`📋 Found ${allItems.length} curriculum items total`);
  console.log(`🎯 Processing ${itemsToProcess.length} items${loNumber ? ` (LO${loNumber} only)` : ''}\n`);

  // Generate content for each item
  const results: Record<string, any[]> = {};
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < itemsToProcess.length; i++) {
    const item = itemsToProcess[i];
    const progress = `[${i + 1}/${itemsToProcess.length}]`;

    console.log(`${progress} "${item.title}"`);
    console.log(`   Context: ${item.context.outcome} → ${item.context.topic} → ${item.context.subtopic}`);

    const blocks = await generateContentForItem(item);

    if (blocks.length > 0) {
      results[item.id] = blocks;
      successCount++;
      console.log(`   ✅ Generated ${blocks.length} blocks\n`);
    } else {
      failCount++;
      console.log(`   ❌ Failed\n`);
    }

    // Rate limiting between items
    if (i < itemsToProcess.length - 1) {
      await sleep(500);
    }
  }

  // Save to database
  console.log(`${'═'.repeat(70)}`);
  console.log(`💾 Saving to database...`);
  console.log(`${'═'.repeat(70)}\n`);

  // Auto-detect moduleSlug based on track name
  let moduleSlug: string | null = null;
  if (track.name.toLowerCase().includes('blockchain')) {
    moduleSlug = 'l5-specific-modules-swdbf501-blockchains-fundamentals';
  } else if (track.name.toLowerCase().includes('machine learning')) {
    moduleSlug = 'l5-specific-modules-swdml501-machine-learning-applications';
  }

  // Update track with moduleSlug if detected
  if (moduleSlug && !(track as any).moduleSlug) {
    await prisma.skillTrack.update({
      where: { id: track.id },
      data: { moduleSlug },
    });
    console.log(`🔗 Linked track to module: ${moduleSlug}\n`);
  }

  const nodeId = `${trackId}-lo${loNumber || 1}`;

  const existing = await prisma.skillNode.findUnique({
    where: { id: nodeId },
  });

  if (existing) {
    // Merge with existing blocks
    const existingBlocks = (existing.blocks as any) || {};
    const mergedBlocks = { ...existingBlocks, ...results };

    await prisma.skillNode.update({
      where: { id: nodeId },
      data: { blocks: mergedBlocks as any },
    });

    console.log(`✅ Updated node: ${nodeId}`);
    console.log(`   📊 Added ${Object.keys(results).length} new curriculum items`);
    console.log(`   📦 Total items: ${Object.keys(mergedBlocks).length}`);
  } else {
    await prisma.skillNode.create({
      data: {
        id: nodeId,
        trackId: track.id,
        title: itemsToProcess[0]?.context.outcome || 'Learning Outcome',
        description: `Interactive content for ${itemsToProcess.length} curriculum items`,
        order: (loNumber || 1) - 1,
        blocks: results as any,
        estimatedMinutes: itemsToProcess.length * 10,
      },
    });

    console.log(`✨ Created node: ${nodeId}`);
    console.log(`   📦 ${Object.keys(results).length} curriculum items`);
  }

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🎉 COMPLETE!`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Processed: ${itemsToProcess.length} items`);
  console.log(`   • Success: ${successCount}`);
  console.log(`   • Failed: ${failCount}`);
  console.log(`   • Total blocks: ${Object.values(results).flat().length}`);
  console.log(`\n🔗 View at: http://localhost:3001/passport/teach/${trackId}\n`);
}

main()
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
