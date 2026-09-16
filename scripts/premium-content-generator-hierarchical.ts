#!/usr/bin/env ts-node
/**
 * HIERARCHICAL PREMIUM CONTENT GENERATOR - Coursera/Duolingo Grade
 * 
 * Generates interactive content at ALL 4 LEVELS of curriculum hierarchy:
 * Level 1: Learning Outcome (LO) - Big picture overview
 * Level 2: Topic - Section introduction  
 * Level 3: Indicative Content - Main detailed lesson
 * Level 4: Subtopic/Item - Focused micro-lesson
 * 
 * Each level gets appropriate content depth and block count.
 * Uses FREE Groq API keys with automatic rotation.
 */

import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Load ALL free Groq API keys (17-21)
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4, process.env.GROQ_API_KEY_5, process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7, process.env.GROQ_API_KEY_8, process.env.GROQ_API_KEY_9,
  process.env.GROQ_API_KEY_10, process.env.GROQ_API_KEY_11, process.env.GROQ_API_KEY_12,
  process.env.GROQ_API_KEY_13, process.env.GROQ_API_KEY_14, process.env.GROQ_API_KEY_15,
  process.env.GROQ_API_KEY_16, process.env.GROQ_API_KEY_17, process.env.GROQ_API_KEY_18,
  process.env.GROQ_API_KEY_19, process.env.GROQ_API_KEY_20, process.env.GROQ_API_KEY_21,
].filter(Boolean) as string[];

console.log(`✅ Loaded ${GROQ_KEYS.length} API keys for rotation`);

let currentKeyIndex = 0;
let requestCount = 0;
const exhaustedKeys = new Set<number>(); // Track keys that hit daily limit

function getGroqClient() {
  return new Groq({ apiKey: GROQ_KEYS[currentKeyIndex] });
}

function rotateKey() {
  const startIndex = currentKeyIndex;
  do {
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;

    // Skip exhausted keys
    if (!exhaustedKeys.has(currentKeyIndex)) {
      console.log(`🔄 Rotated to API key ${currentKeyIndex + 1} of ${GROQ_KEYS.length} (${exhaustedKeys.size} exhausted)`);
      return true;
    }
  } while (currentKeyIndex !== startIndex);

  // All keys exhausted
  console.log(`❌ All ${GROQ_KEYS.length} API keys exhausted`);
  return false;
}

function markKeyExhausted() {
  exhaustedKeys.add(currentKeyIndex);
  console.log(`⚠️  Key ${currentKeyIndex + 1} marked as exhausted (daily limit reached)`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Load the premium system prompt (compact modern version)
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../prompts/ultra-modern-content-prompt-v2.md'),
  'utf-8'
);

console.log(`✅ Loaded premium system prompt (${Math.round(SYSTEM_PROMPT.length / 1024)}KB)`);

interface TOCNode {
  id: string;
  title: string;
  type: 'outcome' | 'topic' | 'subtopic' | 'item';
  parentId?: string;
  order: number;
  items?: string[]; // Level 4: leaf items
}

interface HierarchyContext {
  level: 1 | 2 | 3 | 4;
  nodeId: string;
  nodeTitle: string;
  parentPath: string;
  moduleCode: string;
  moduleName: string;
  learningOutcome: string;
  performanceCriteria: string[];
  indicativeContent: string[];
  theoryPct: number;
  practicalPct: number;
  officialTools: string[];
}

async function generateContentForNode(context: HierarchyContext): Promise<any> {
  /**
   * Generates premium interactive content for ONE node in the TOC hierarchy
   * Content depth/type adapts based on level (1-4)
   */

  const levelGuidance = {
    1: {
      description: 'Learning Outcome Overview - Big picture introduction',
      blocks: '5-8 blocks',
      includes: ['LO journey roadmap', 'Achievement overview', 'Real-world showcase', 'Prerequisite check', 'Motivational hook']
    },
    2: {
      description: 'Topic Introduction - Section overview',
      blocks: '4-6 blocks',
      includes: ['Topic placement in LO', 'Key concepts preview', 'Learning objectives', 'Quick diagnostic']
    },
    3: {
      description: 'Indicative Content - Full interactive lesson',
      blocks: '7-12 blocks',
      includes: ['Concept explanations (2-3)', 'Interactive exercises (2-3)', 'Examples', 'Practice quiz', 'Summary']
    },
    4: {
      description: 'Subtopic/Item - Focused micro-lesson',
      blocks: '3-5 blocks',
      includes: ['Definition/explanation', 'Example/demo', 'Interactive practice', 'Quick check']
    }
  };

  const guidance = levelGuidance[context.level];

  const userPrompt = `Generate interactive content for Rwanda TVET/TSS students:

## MODULE CONTEXT
- Module: ${context.moduleName} (${context.moduleCode})
- Learning Outcome: ${context.learningOutcome}
- Performance Criteria:
${context.performanceCriteria.map((pc, i) => `  ${i + 1}. ${pc}`).join('\n')}
- Theory/Practical: ${context.theoryPct}%/${context.practicalPct}%
- Official Tools: ${context.officialTools.join(', ')}

## HIERARCHY CONTEXT (CRITICAL)
- **Hierarchy Level: ${context.level}** (1=LO, 2=Topic, 3=Indicative Content, 4=Item)
- **Content Type: ${guidance.description}**
- **Target: ${guidance.blocks}**
- **Parent Path:** ${context.parentPath}
- **Current Node:** "${context.nodeTitle}"

## LEVEL ${context.level} CONTENT REQUIREMENTS

${guidance.includes.map(item => `  • ${item}`).join('\n')}

## GENERAL REQUIREMENTS
- Match ${context.practicalPct}% practical weighting
- Use ONLY listed official tools
- Rwanda context (mobile money, motos, cooperatives)
- Include: 1 roadmap, 3+ image_briefs, 1+ video_ref, level-appropriate exercises
- <100 words per text block
- Vary interaction types
- Output valid JSON only (no markdown fences)

**IMPORTANT:** Adjust content depth for Level ${context.level}. ${context.level === 1 ? 'This is the BIG PICTURE overview.' :
      context.level === 2 ? 'This is a SECTION INTRODUCTION.' :
        context.level === 3 ? 'This is the MAIN DETAILED LESSON.' :
          'This is a FOCUSED MICRO-LESSON on one specific item.'
    }`;

  for (let attempt = 1; attempt <= GROQ_KEYS.length; attempt++) {
    try {
      const client = getGroqClient();
      requestCount++;

      console.log(`   🤖 Generating Level ${context.level} content (key ${currentKeyIndex + 1}, attempt ${attempt})...`);

      const response = await client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.75,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      });

      let content = response.choices[0].message.content || '{}';

      // Clean markdown
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(content);

      // Validate
      if (!parsed.roadmap_image) {
        console.log(`   ⚠️  Warning: Missing roadmap_image, but continuing with content`);
        // Add a default roadmap if missing
        if (!parsed.roadmap_image) {
          parsed.roadmap_image = {
            orientation: "tree",
            style: "game_map",
            theme: context.learningOutcome,
            description: `Visual roadmap for ${context.nodeTitle}`
          };
        }
      }
      if (!parsed.blocks || parsed.blocks.length < 2) {
        throw new Error(`Too few blocks: ${parsed.blocks?.length || 0}`);
      }

      const imageCount = parsed.blocks.filter((b: any) => b.image_brief).length;
      const exerciseCount = parsed.blocks.filter((b: any) => b.type === 'exercise').length;

      console.log(`   ✅ Level ${context.level}: ${parsed.blocks.length} blocks (${imageCount} images, ${exerciseCount} exercises)`);

      return {
        level: context.level,
        nodeId: context.nodeId,
        content: parsed,
        metadata: {
          block_count: parsed.blocks.length,
          image_count: imageCount,
          exercise_count: exerciseCount
        }
      };

    } catch (error: any) {
      const isRateLimitError = error.status === 429 ||
        error.code === 'rate_limit_exceeded' ||
        error.message?.includes('Rate limit') ||
        error.message?.includes('rate_limit');

      const isDailyLimitError = error.message?.includes('tokens per day') ||
        error.message?.includes('TPD:');

      if (isRateLimitError) {
        if (isDailyLimitError) {
          // This key hit daily limit, mark it as exhausted
          markKeyExhausted();
        }

        if (attempt < GROQ_KEYS.length && exhaustedKeys.size < GROQ_KEYS.length) {
          console.log(`   ⚠️  Rate limit on key ${currentKeyIndex + 1}, rotating...`);
          const rotated = rotateKey();
          if (!rotated) {
            console.error(`   ❌ All API keys exhausted. Please wait or add more keys.`);
            return null;
          }
          await sleep(3000); // Wait 3 seconds before trying next key
          continue;
        }
      }

      console.error(`   ❌ Failed: ${error.status || error.code} ${error.message}`);

      if (attempt < 3) {
        const rotated = rotateKey();
        if (!rotated) {
          return null;
        }
        await sleep(2000);
        continue;
      }

      return null;
    }
  }

  return null;
}

async function extractHierarchy(track: any, filterLO?: string): Promise<HierarchyContext[]> {
  /**
   * Extracts ALL 4 levels from TOC and builds context for each node
   * @param filterLO - Optional: filter to specific LO (e.g., 'lo1' for Learning Outcome 1 only)
   */
  const toc = track.tableOfContents || [];
  const contexts: HierarchyContext[] = [];

  // Level 1: Learning Outcomes
  let outcomes = toc.filter((t: any) => t.type === 'outcome');

  // Filter to specific LO if requested
  if (filterLO) {
    outcomes = outcomes.filter((t: any) => t.id === filterLO);
    console.log(`🎯 Filtering to ${filterLO}: "${outcomes[0]?.title}"`);
  }

  // Level 2: Topics
  const topics = toc.filter((t: any) => t.type === 'topic');

  // Level 3: Indicative Content (subtopics)
  const subtopics = toc.filter((t: any) => t.type === 'subtopic');

  // Level 4: Items (clickable leaf nodes!)
  const items = toc.filter((t: any) => t.type === 'item');

  // Build base context from track metadata
  const baseContext = {
    moduleCode: track.id.split('-').find((p: string) => p.match(/^[A-Z]{5,8}\d{3,4}$/i)) || 'MODULE',
    moduleName: track.name,
    learningOutcome: 'Design and implement systems',
    performanceCriteria: [
      'Identify system requirements',
      'Select appropriate technologies',
      'Design secure architecture'
    ],
    indicativeContent: [],
    theoryPct: 40,
    practicalPct: 60,
    officialTools: ['VS Code', 'Git', 'Docker', 'Remix IDE', 'MetaMask', 'Ganache']
  };

  // Level 1: Generate context for each Learning Outcome
  outcomes.forEach((lo: TOCNode, loIdx: number) => {
    contexts.push({
      level: 1,
      nodeId: lo.id,
      nodeTitle: lo.title,
      parentPath: track.name,
      ...baseContext,
      learningOutcome: lo.title
    });

    // Level 2: Topics under this LO
    const loTopics = topics.filter((t: TOCNode) => t.parentId === lo.id);
    loTopics.forEach((topic: TOCNode) => {
      contexts.push({
        level: 2,
        nodeId: topic.id,
        nodeTitle: topic.title,
        parentPath: `${lo.title}`,
        ...baseContext,
        learningOutcome: lo.title
      });

      // Level 3: Indicative Content under this Topic
      const topicSubtopics = subtopics.filter((s: TOCNode) => s.parentId === topic.id);
      topicSubtopics.forEach((sub: TOCNode) => {
        contexts.push({
          level: 3,
          nodeId: sub.id,
          nodeTitle: sub.title,
          parentPath: `${lo.title} → ${topic.title}`,
          ...baseContext,
          learningOutcome: lo.title,
          indicativeContent: [sub.title]
        });

        // Level 4: Items under this Subtopic (from TOC nodes, not array)
        const subItems = items.filter((item: TOCNode) => item.parentId === sub.id);
        subItems.forEach((item: TOCNode) => {
          contexts.push({
            level: 4,
            nodeId: item.id,
            nodeTitle: item.title,
            parentPath: `${lo.title} → ${topic.title} → ${sub.title}`,
            ...baseContext,
            learningOutcome: lo.title,
            indicativeContent: [sub.title, item.title]
          });
        });
      });
    });
  });

  return contexts;
}

async function main() {
  console.log(`${'═'.repeat(80)}`);
  console.log(`🎨 HIERARCHICAL PREMIUM CONTENT GENERATOR`);
  console.log(`   Generates content at ALL 4 levels: LO → Topic → Indicative → Item`);
  console.log(`   Using ${GROQ_KEYS.length} free Groq API keys`);
  console.log(`${'═'.repeat(80)}\n`);

  const args = process.argv.slice(2);
  const command = args[0]; // test | full
  const trackId = args[1];
  const targetLevel = args[2] ? parseInt(args[2]) : null; // Optional: generate only level 1, 2, 3, or 4
  const filterLO = args[3]; // Optional: filter to specific LO (e.g., 'lo1')

  if (!command || !trackId) {
    console.log(`Usage:`);
    console.log(`  npm run hierarchical-generate test <TRACK_ID> [LEVEL] [LO]`);
    console.log(`  npm run hierarchical-generate full <TRACK_ID> [LEVEL] [LO]`);
    console.log(`\nLevels:`);
    console.log(`  1 = Learning Outcome overviews only`);
    console.log(`  2 = Topic introductions only`);
    console.log(`  3 = Indicative Content (main lessons) only`);
    console.log(`  4 = Item details only`);
    console.log(`  (omit to generate ALL levels)`);
    console.log(`\nLO Filter:`);
    console.log(`  lo1, lo2, lo3, lo4 = Generate only nodes under that Learning Outcome`);
    console.log(`  (omit to generate ALL Learning Outcomes)`);
    console.log(`\nExamples:`);
    console.log(`  npm run hierarchical-generate test l5-swdbf501 1         # Test LO overviews`);
    console.log(`  npm run hierarchical-generate full l5-swdbf501           # All 4 levels`);
    console.log(`  npm run hierarchical-generate full l5-swdbf501 3 lo1    # LO1 Level 3 only`);
    console.log(`  npm run hierarchical-generate full l5-swdbf501 '' lo1   # LO1 all levels`);
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
  console.log(`📚 Extracting 4-level hierarchy...\n`);

  // Extract all nodes from hierarchy (with optional LO filter)
  const allContexts = await extractHierarchy(track, filterLO);

  // Filter by level if specified
  const contextsToProcess = targetLevel
    ? allContexts.filter(c => c.level === targetLevel)
    : allContexts;

  // Test mode: process only first node
  const nodesToGenerate = command === 'test'
    ? contextsToProcess.slice(0, 1)
    : contextsToProcess;

  console.log(`📊 Hierarchy breakdown:`);
  console.log(`   Level 1 (LO): ${allContexts.filter(c => c.level === 1).length} nodes`);
  console.log(`   Level 2 (Topic): ${allContexts.filter(c => c.level === 2).length} nodes`);
  console.log(`   Level 3 (Indicative): ${allContexts.filter(c => c.level === 3).length} nodes`);
  console.log(`   Level 4 (Item): ${allContexts.filter(c => c.level === 4).length} nodes`);
  console.log(`\n🎯 ${command === 'test' ? 'TEST MODE' : 'FULL MODE'}: Processing ${nodesToGenerate.length} nodes${targetLevel ? ` (Level ${targetLevel} only)` : ''}\n`);

  // Generate content
  const results: any[] = [];
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < nodesToGenerate.length; i++) {
    const ctx = nodesToGenerate[i];
    const progress = `[${i + 1}/${nodesToGenerate.length}]`;

    console.log(`${progress} Level ${ctx.level}: "${ctx.nodeTitle}"`);
    console.log(`   Path: ${ctx.parentPath}`);

    const result = await generateContentForNode(ctx);

    if (result) {
      results.push(result);
      successCount++;
    } else {
      failCount++;

      // Check if all keys exhausted
      if (exhaustedKeys.size >= GROQ_KEYS.length) {
        console.log(`\n❌ All API keys exhausted. Stopping generation.`);
        console.log(`   Generated ${successCount}/${nodesToGenerate.length} nodes before limit.`);
        break;
      }
    }

    // Rate limiting
    if (i < nodesToGenerate.length - 1) {
      console.log(`   ⏳ Waiting 3s...\n`);
      await sleep(3000);
    } else {
      console.log();
    }
  }

  const elapsedMin = Math.round((Date.now() - startTime) / 60000);

  // Summary
  console.log(`${'═'.repeat(80)}`);
  console.log(`🎉 GENERATION COMPLETE!`);
  console.log(`${'═'.repeat(80)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Nodes processed: ${nodesToGenerate.length}`);
  console.log(`   • Success: ${successCount}`);
  console.log(`   • Failed: ${failCount}`);
  console.log(`   • API requests: ${requestCount}`);
  console.log(`   • Time: ${elapsedMin} minutes`);
  console.log(`   • Keys used: ${GROQ_KEYS.length}`);

  const totalBlocks = results.reduce((sum, r) => sum + r.metadata.block_count, 0);
  const totalImages = results.reduce((sum, r) => sum + r.metadata.image_count, 0);

  console.log(`\n🎨 Content quality:`);
  console.log(`   • Total blocks: ${totalBlocks}`);
  console.log(`   • Total images: ${totalImages}`);
  console.log(`   • Avg blocks per node: ${(totalBlocks / successCount).toFixed(1)}`);

  if (command === 'test') {
    console.log(`\n👀 Sample output:`);
    console.log(JSON.stringify(results[0], null, 2).substring(0, 800) + '...\n');
    console.log(`💡 Next: Run in FULL mode to generate all content`);
    console.log(`   npm run hierarchical-generate full ${trackId}\n`);
  } else {
    console.log(`\n💾 Saving to database...`);

    // Save content to database
    // Group results by node ID and save to SkillNode.blocks
    const contentByNode: Record<string, any> = {};

    results.forEach((result: any) => {
      contentByNode[result.nodeId] = result.content;
    });

    console.log(`   Processing ${Object.keys(contentByNode).length} nodes...\n`);

    // For each node, create or update SkillNode
    let savedCount = 0;
    for (const [nodeId, content] of Object.entries(contentByNode)) {
      try {
        // Check if node exists
        const existing = await prisma.skillNode.findUnique({
          where: { id: nodeId }
        });

        if (existing) {
          // Update existing node
          await prisma.skillNode.update({
            where: { id: nodeId },
            data: {
              blocks: content as any,
              estimatedMinutes: content.estimated_minutes || 15
            }
          });
        } else {
          // Create new node
          await prisma.skillNode.create({
            data: {
              id: nodeId,
              trackId: trackId,
              title: content.lesson_title || 'Interactive Lesson',
              description: content.learning_outcome || 'Premium content',
              order: 0,
              blocks: content as any,
              estimatedMinutes: content.estimated_minutes || 15
            }
          });
        }
        savedCount++;
        if (savedCount % 10 === 0) {
          console.log(`   Saved ${savedCount}/${Object.keys(contentByNode).length} nodes...`);
        }
      } catch (error: any) {
        console.error(`   ⚠️  Failed to save node ${nodeId}:`, error.message);
      }
    }

    console.log(`\n✅ Saved ${savedCount} nodes to database!`);
    console.log(`🔗 View at: http://localhost:3001/passport/teach/${trackId}\n`);
  }
}

main()
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
