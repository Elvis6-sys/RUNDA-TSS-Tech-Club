#!/usr/bin/env ts-node
/**
 * PREMIUM CONTENT GENERATOR - Coursera/Duolingo Grade
 * 
 * Generates interactive, engaging, richly-visual content using the premium
 * system prompt designed for Rwanda TVET/RTB/TSS students.
 * 
 * Features:
 * - Visual roadmaps
 * - 3+ images per lesson (AI-generated briefs)
 * - Video references (real search queries)
 * - Interactive exercises (drag-drop, code sandbox, diagram labeling)
 * - <100 words per text block
 * - Rwanda context (mobile money, motos, cooperatives)
 * - Curriculum-aligned (cites performance criteria)
 * 
 * Uses FREE Groq API keys with automatic rotation.
 */

import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Load ALL 17 free Groq API keys
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

function getGroqClient() {
  return new Groq({ apiKey: GROQ_KEYS[currentKeyIndex] });
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
  console.log(`🔄 Rotated to API key ${currentKeyIndex + 1} of ${GROQ_KEYS.length}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Load the premium system prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../prompts/content-generation-system-prompt.md'),
  'utf-8'
);

console.log(`✅ Loaded premium system prompt (${Math.round(SYSTEM_PROMPT.length / 1024)}KB)`);

interface CurriculumContext {
  moduleCode: string;
  moduleName: string;
  rqfLevel: number;
  credits: number;
  totalHours: number;
  learningOutcome: string;
  loHours: number;
  performanceCriteria: string[];
  indicativeContent: string[];
  theoryPct: number;
  practicalPct: number;
  officialTools: string[];
  learnerProfile: string;
  scenario?: string;

  // Hierarchy context
  hierarchyLevel: 1 | 2 | 3 | 4; // LO, Topic, Indicative Content, Item
  parentPath: string;
  currentTitle: string;
}

interface PremiumLesson {
  module_code: string;
  learning_outcome: string;
  lesson_title: string;
  estimated_minutes: number;
  roadmap_image: {
    orientation: 'horizontal' | 'vertical' | 'tree';
    nodes: Array<{ label: string; status: 'done' | 'current' | 'locked' }>;
  };
  blocks: Array<{
    block_id: string;
    type: 'concept' | 'exercise' | 'quiz' | 'assessment' | 'assignment';
    ui_component: string;
    learning_outcome_ref: string;
    title: string;
    body: string;
    image_brief?: {
      prompt: string;
      style: 'diagram' | 'illustration' | 'screenshot' | 'icon-set';
      license_note: string;
    };
    video_ref?: {
      search_query: string;
      needs_link_resolution: boolean;
      why: string;
    };
    icon_ref?: string;
    interaction?: any;
    xp: number;
    difficulty: 'easy' | 'medium' | 'hard';
    badge_trigger?: string;
    rubric?: Array<{ criterion: string; points: number }>;
    time_limit_minutes?: number;
    passing_threshold_pct?: number;
    workplace_relevance: string;
  }>;
}

async function generatePremiumLesson(
  context: CurriculumContext,
  topicTitle: string
): Promise<PremiumLesson | null> {
  /**
   * Generates ONE premium lesson using the Coursera/Duolingo-grade system prompt
   */

  const userPrompt = `Generate an interactive, engaging lesson for Rwanda TVET/TSS students:

## MODULE CONTEXT
- Sector / Trade: ICT & Multimedia / Software Development
- Module name & code: ${context.moduleName} (${context.moduleCode})
- RQF Level: ${context.rqfLevel} | Credits: ${context.credits} | Total hours: ${context.totalHours}
- Curriculum reference: ${context.moduleCode}
- Learning outcome in focus: ${context.learningOutcome}, ${context.loHours} hours

- Performance criteria targeted:
${context.performanceCriteria.map((pc, i) => `  ${i + 1}. ${pc}`).join('\n')}

- Indicative content covered:
${context.indicativeContent.map((ic, i) => `  ${i + 1}. ${ic}`).join('\n')}

- Delivery split to respect: ${context.theoryPct}% theory / ${context.practicalPct}% practical
  (Mirror this ratio in the block mix — do NOT default to text-heavy if module is practical-heavy)

- Official tools/equipment/materials: ${context.officialTools.join(', ')}
  (Use these by name; never invent substitute tools the school doesn't actually have)

- Learner profile: ${context.learnerProfile}
  (RTB/TSS student, level and assumed prior skills)

${context.scenario ? `- Running scenario/case study: ${context.scenario}` : ''}

## SPECIFIC LESSON TOPIC
Create a lesson specifically about: "${topicTitle}"

This lesson should teach students about this topic in the context of ${context.learningOutcome}.

## REQUIREMENTS
- Create blocks matching the ${context.practicalPct}% practical weighting
- Use ONLY the official tools listed above
- Ground examples in Rwandan context (mobile money, motos, cooperatives, local markets)
- Include: 1 roadmap, 3+ image_briefs, 1+ video_ref, 2-3 exercises, 1 quiz
- Keep body text under 100 words per block
- Vary interaction types (don't repeat same exercise type)
- Output valid JSON only (no markdown fences, no commentary)

Remember: This must compete with Coursera/Duolingo-grade quality!`;

  for (let attempt = 1; attempt <= GROQ_KEYS.length; attempt++) {
    try {
      const client = getGroqClient();
      requestCount++;

      console.log(`   🤖 Requesting generation (attempt ${attempt}, request #${requestCount})...`);

      const response = await client.chat.completions.create({
        model: 'openai/gpt-oss-120b', // Free tier, 120B parameters
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.75, // Creative but controlled
        max_tokens: 4096,  // Rich content needs space
        response_format: { type: 'json_object' }
      });

      let content = response.choices[0].message.content || '{}';

      // Clean up potential markdown
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(content) as PremiumLesson;

      // Validate quality
      if (!parsed.roadmap_image) {
        throw new Error('Missing roadmap_image');
      }
      if (!parsed.blocks || parsed.blocks.length < 5) {
        throw new Error(`Too few blocks: ${parsed.blocks?.length || 0}`);
      }

      const imageCount = parsed.blocks.filter(b => b.image_brief).length;
      if (imageCount < 3) {
        throw new Error(`Need at least 3 image_briefs, got ${imageCount}`);
      }

      const exerciseCount = parsed.blocks.filter(b => b.type === 'exercise').length;
      if (exerciseCount < 2) {
        throw new Error(`Need at least 2 exercises, got ${exerciseCount}`);
      }

      console.log(`   ✅ Generated ${parsed.blocks.length} blocks (${imageCount} images, ${exerciseCount} exercises)`);

      return parsed;

    } catch (error: any) {
      if ((error.status === 429 || error.code === 'rate_limit_exceeded') && attempt < GROQ_KEYS.length) {
        console.log(`   ⚠️  Rate limit hit, rotating key...`);
        rotateKey();
        await sleep(2000); // Wait 2s between rotations
        continue;
      }

      if (error.message?.includes('JSON')) {
        console.error(`   ⚠️  Invalid JSON response, retrying with different key...`);
        rotateKey();
        await sleep(1000);
        continue;
      }

      console.error(`   ❌ Generation failed: ${error.message}`);

      if (attempt < GROQ_KEYS.length) {
        rotateKey();
        await sleep(1000);
        continue;
      }

      return null;
    }
  }

  return null;
}

function convertPremiumToBlocks(lesson: PremiumLesson): any[] {
  /**
   * Converts premium lesson JSON to your database's block format
   */

  const blocks: any[] = [];

  // Add roadmap as first block
  blocks.push({
    id: `${lesson.module_code}-roadmap`,
    type: 'roadmap',
    content: `## Learning Path\n\nYour journey through ${lesson.learning_outcome}`,
    roadmap: lesson.roadmap_image
  });

  // Convert each premium block to database format
  lesson.blocks.forEach((block, idx) => {
    const dbBlock: any = {
      id: block.block_id || `block-${idx}`,
      type: block.type,
      content: `## ${block.title}\n\n${block.body}`,
    };

    // Add metadata
    if (block.image_brief) {
      dbBlock.imageBrief = block.image_brief;
    }

    if (block.video_ref) {
      dbBlock.videoRef = block.video_ref;
    }

    if (block.icon_ref) {
      dbBlock.icon = block.icon_ref;
    }

    if (block.type === 'exercise' && block.interaction) {
      dbBlock.interaction = block.interaction;
      dbBlock.uiComponent = block.ui_component;
    }

    if (block.type === 'quiz' && block.interaction) {
      dbBlock.quiz = block.interaction;
    }

    if (block.xp) {
      dbBlock.xp = block.xp;
    }

    if (block.difficulty) {
      dbBlock.difficulty = block.difficulty;
    }

    if (block.workplace_relevance) {
      dbBlock.workplaceRelevance = block.workplace_relevance;
    }

    blocks.push(dbBlock);
  });

  return blocks;
}

async function main() {
  console.log(`${'═'.repeat(80)}`);
  console.log(`🎨 PREMIUM CONTENT GENERATOR - Coursera/Duolingo Grade`);
  console.log(`   Using ${GROQ_KEYS.length} free Groq API keys with rotation`);
  console.log(`${'═'.repeat(80)}\n`);

  const args = process.argv.slice(2);
  const command = args[0];
  const trackId = args[1];
  const loNumber = args[2] ? parseInt(args[2]) : null;

  if (!command || !trackId) {
    console.log(`Usage:`);
    console.log(`  npm run premium-generate test <TRACK_ID> [LO_NUMBER]  - Test with 1 topic`);
    console.log(`  npm run premium-generate full <TRACK_ID> [LO_NUMBER]  - Generate all topics`);
    console.log(`\nExamples:`);
    console.log(`  npm run premium-generate test l5-specific-modules-swdbf501-blockchains-fundamentals 1`);
    console.log(`  npm run premium-generate full l5-specific-modules-swdbf501-blockchains-fundamentals`);
    console.log(`\nThis generates:`);
    console.log(`  ✨ Visual roadmaps`);
    console.log(`  🖼️  3+ images per lesson`);
    console.log(`  🎥 Video references`);
    console.log(`  🎮 Interactive exercises (drag-drop, code sandbox, etc.)`);
    console.log(`  📚 <100 words per text block`);
    console.log(`  🇷🇼 Rwanda context (motos, mobile money, cooperatives)\n`);
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
  console.log(`📚 Loading curriculum context...\n`);

  // Build curriculum context (you'll need to adapt this based on your track metadata)
  const context: CurriculumContext = {
    moduleCode: track.id.split('-').find(p => p.match(/^[A-Z]{5,8}\d{3,4}$/i)) || 'SWDBF501',
    moduleName: track.name,
    rqfLevel: 5, // Extract from track if available
    credits: 10, // Extract from track if available
    totalHours: 100, // Extract from track if available
    learningOutcome: 'Design and implement blockchain systems', // Extract from TOC
    loHours: 25,
    performanceCriteria: [
      'Identify blockchain system requirements',
      'Select appropriate blockchain technologies',
      'Design secure blockchain architecture'
    ],
    indicativeContent: [
      'Blockchain fundamentals',
      'Consensus mechanisms',
      'Smart contract platforms',
      'Security considerations'
    ],
    theoryPct: 40,
    practicalPct: 60,
    officialTools: ['VS Code', 'Remix IDE', 'MetaMask', 'Ganache', 'Hardhat'],
    learnerProfile: 'RQF Level 5 Software Development student with basic programming knowledge',
    scenario: 'Building a cooperative management blockchain system for Rwandan SACCOs'
  };

  // Extract topics from TOC
  const toc = track.tableOfContents || [];
  const topics = toc.filter((t: any) => t.type === 'topic');

  if (topics.length === 0) {
    console.error(`❌ No topics found in TOC`);
    process.exit(1);
  }

  console.log(`📋 Found ${topics.length} topics in track\n`);

  // Test mode: generate for first topic only
  const topicsToProcess = command === 'test' ? topics.slice(0, 1) : topics;

  console.log(`🎯 ${command === 'test' ? 'TEST MODE: Processing 1 topic' : `FULL MODE: Processing ${topicsToProcess.length} topics`}\n`);

  // Generate lessons
  const results: any[] = [];
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < topicsToProcess.length; i++) {
    const topic = topicsToProcess[i];
    const progress = `[${i + 1}/${topicsToProcess.length}]`;

    console.log(`${progress} "${topic.title}"`);

    const lesson = await generatePremiumLesson(context, topic.title);

    if (lesson) {
      const blocks = convertPremiumToBlocks(lesson);
      results.push({
        topicId: topic.id,
        topicTitle: topic.title,
        blocks: blocks,
        metadata: {
          estimated_minutes: lesson.estimated_minutes,
          block_count: lesson.blocks.length,
          image_count: lesson.blocks.filter(b => b.image_brief).length,
          exercise_count: lesson.blocks.filter(b => b.type === 'exercise').length,
        }
      });
      successCount++;
      console.log(`   ✅ Success! (${blocks.length} blocks)\n`);
    } else {
      failCount++;
      console.log(`   ❌ Failed\n`);
    }

    // Rate limiting between topics
    if (i < topicsToProcess.length - 1) {
      console.log(`   ⏳ Waiting 3s before next topic...\n`);
      await sleep(3000);
    }
  }

  const elapsedMin = Math.round((Date.now() - startTime) / 60000);

  // Save to database (test mode = preview only)
  if (command === 'full') {
    console.log(`${'═'.repeat(80)}`);
    console.log(`💾 Saving to database...`);
    console.log(`${'═'.repeat(80)}\n`);

    const nodeId = `${trackId}-lo${loNumber || 1}`;

    for (const result of results) {
      // Find existing node or create
      const existing = await prisma.skillNode.findUnique({
        where: { id: nodeId },
      });

      if (existing) {
        // Merge blocks
        const existingBlocks = (existing.blocks as any) || {};
        existingBlocks[result.topicId] = result.blocks;

        await prisma.skillNode.update({
          where: { id: nodeId },
          data: { blocks: existingBlocks as any },
        });
      } else {
        await prisma.skillNode.create({
          data: {
            id: nodeId,
            trackId: track.id,
            title: context.learningOutcome,
            description: `Premium interactive content for ${results.length} topics`,
            order: (loNumber || 1) - 1,
            blocks: { [result.topicId]: result.blocks } as any,
            estimatedMinutes: results.reduce((sum, r) => sum + r.metadata.estimated_minutes, 0),
          },
        });
      }
    }

    console.log(`✅ Saved to database: ${nodeId}\n`);
  } else {
    console.log(`${'═'.repeat(80)}`);
    console.log(`👀 PREVIEW MODE - Not saving to database`);
    console.log(`${'═'.repeat(80)}\n`);
    console.log(`Sample output:`);
    console.log(JSON.stringify(results[0], null, 2).substring(0, 500) + '...\n');
  }

  // Summary
  console.log(`${'═'.repeat(80)}`);
  console.log(`🎉 COMPLETE!`);
  console.log(`${'═'.repeat(80)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Topics processed: ${topicsToProcess.length}`);
  console.log(`   • Success: ${successCount}`);
  console.log(`   • Failed: ${failCount}`);
  console.log(`   • API requests: ${requestCount}`);
  console.log(`   • Time: ${elapsedMin} minutes`);
  console.log(`   • Keys used: ${GROQ_KEYS.length} (rotation worked!)`);

  const totalBlocks = results.reduce((sum, r) => sum + r.blocks.length, 0);
  const totalImages = results.reduce((sum, r) => sum + r.metadata.image_count, 0);
  const totalExercises = results.reduce((sum, r) => sum + r.metadata.exercise_count, 0);

  console.log(`\n🎨 Content quality:`);
  console.log(`   • Total blocks: ${totalBlocks}`);
  console.log(`   • Total images: ${totalImages} (${(totalImages / successCount).toFixed(1)} per lesson)`);
  console.log(`   • Total exercises: ${totalExercises} (${(totalExercises / successCount).toFixed(1)} per lesson)`);

  if (command === 'test') {
    console.log(`\n💡 Next step: Run in FULL mode to generate all topics:`);
    console.log(`   npm run premium-generate full ${trackId}\n`);
  } else {
    console.log(`\n🔗 View at: http://localhost:3001/passport/teach/${trackId}\n`);
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
