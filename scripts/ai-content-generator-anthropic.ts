#!/usr/bin/env ts-node
/**
 * AI CONTENT GENERATOR (Using Anthropic Claude)
 * 
 * Uses your existing 13 Anthropic API keys to generate interactive content
 * NO ADDITIONAL COST - uses keys you already have!
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface LearningOutcome {
  number: number;
  title: string;
  performanceCriteria?: string[];
}

interface CurriculumModule {
  code: string;
  title: string;
  level: string;
  department: string;
  learningOutcomes: LearningOutcome[];
}

interface ContentBlock {
  id: string;
  type: 'text' | 'code' | 'quiz' | 'video' | 'image' | 'callout' | 'tabs' | 'accordion' | 'checklist' | 'diagram';
  [key: string]: any;
}

interface GeneratedContent {
  moduleCode: string;
  learningOutcome: LearningOutcome;
  blocks: ContentBlock[];
  estimatedTime: string;
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites: string[];
    interactiveElements: number;
    multimediaCount: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CURRICULUM_FILE = path.join(__dirname, '..', 'lib', 'curriculum-data', 'curriculum-all.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated-content');

// Use existing Anthropic keys (stored as AT_API_KEY_N in .env)
const API_KEYS = [
  process.env.AT_API_KEY_1,
  process.env.AT_API_KEY_2,
  process.env.AT_API_KEY_3,
  process.env.AT_API_KEY_4,
  process.env.AT_API_KEY_5,
  process.env.AT_API_KEY_6,
  process.env.AT_API_KEY_7,
  process.env.AT_API_KEY_8,
  process.env.AT_API_KEY_9,
  process.env.AT_API_KEY_10,
  process.env.AT_API_KEY_11,
  process.env.AT_API_KEY_12,
  process.env.AT_API_KEY_13,
].filter(Boolean) as string[];

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// API KEY ROTATION
// ═══════════════════════════════════════════════════════════════════════════

let currentKeyIndex = 0;

function getAnthropicClient(): Anthropic {
  if (API_KEYS.length === 0) {
    throw new Error('No Anthropic API keys found in .env');
  }
  const apiKey = API_KEYS[currentKeyIndex];
  return new Anthropic({ apiKey });
}

function rotateAPIKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`🔄 Rotated to key ${currentKeyIndex + 1}/${API_KEYS.length}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT GENERATION PROMPT
// ═══════════════════════════════════════════════════════════════════════════

function buildContentPrompt(module: CurriculumModule, lo: LearningOutcome): string {
  return `Generate comprehensive learning content for TVET education.

**Module**: ${module.code} - ${module.title}
**Level**: ${module.level}
**Learning Outcome ${lo.number}**: ${lo.title}

${lo.performanceCriteria ? `**Performance Criteria**: ${lo.performanceCriteria.join('; ')}` : ''}

Create 15-25 interactive blocks with:
- Text explanations (markdown with ## headers)
- Code examples (Python, Java, SQL, etc.)
- Interactive quizzes (MCQ, True/False)
- Visual callouts (tips, warnings, notes)
- Images/diagrams with captions
- Video suggestions
- Checklists for exercises

**Block ID format**: ${module.code.toLowerCase()}-lo${lo.number}-b{number}

Respond with JSON ONLY (no markdown, no extra text):
{
  "blocks": [
    {"id": "${module.code.toLowerCase()}-lo${lo.number}-b1", "type": "text", "content": "## Introduction..."},
    {"id": "${module.code.toLowerCase()}-lo${lo.number}-b2", "type": "code", "language": "python", "code": "...", "caption": "..."},
    {"id": "${module.code.toLowerCase()}-lo${lo.number}-b3", "type": "quiz", "questions": [...]}
  ],
  "estimatedTime": "45-60 minutes",
  "metadata": {"difficulty": "intermediate", "prerequisites": [], "interactiveElements": 3, "multimediaCount": 2}
}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateContentForLO(
  module: CurriculumModule,
  lo: LearningOutcome
): Promise<GeneratedContent | null> {
  const prompt = buildContentPrompt(module, lo);

  for (let attempt = 1; attempt <= API_KEYS.length; attempt++) {
    try {
      const client = getAnthropicClient();

      console.log(`   🤖 Generating with Claude (attempt ${attempt}/${API_KEYS.length})...`);

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.7,
        system: 'You are an expert instructional designer. Respond with ONLY valid JSON, no markdown or other text.',
        messages: [{
          role: 'user',
          content: prompt
        }],
      });

      let content = response.content[0].type === 'text' ? response.content[0].text : '';

      // Extract JSON from markdown if present
      content = content.trim();
      if (content.startsWith('```json')) content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      else if (content.startsWith('```')) content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');

      const parsed = JSON.parse(content);

      if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
        throw new Error('Invalid structure: missing blocks array');
      }

      return {
        moduleCode: module.code,
        learningOutcome: lo,
        blocks: parsed.blocks,
        estimatedTime: parsed.estimatedTime || '45-60 minutes',
        metadata: parsed.metadata || {
          difficulty: 'intermediate',
          prerequisites: [],
          interactiveElements: 0,
          multimediaCount: 0
        }
      };

    } catch (error: any) {
      console.error(`   ❌ Attempt ${attempt} failed:`, error.message);

      if ((error.status === 429 || error.error?.type === 'rate_limit_error') && attempt < API_KEYS.length) {
        console.log(`   ⏳ Rate limited. Rotating key...`);
        rotateAPIKey();
        await sleep(2000);
        continue;
      }

      if (attempt === API_KEYS.length) {
        return null;
      }

      await sleep(1000 * attempt);
    }
  }

  return null;
}

async function generateContentForModule(
  module: CurriculumModule,
  loFilter?: number[]
): Promise<GeneratedContent[]> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📚 ${module.code} - ${module.title}`);
  console.log(`${'═'.repeat(60)}\n`);

  const results: GeneratedContent[] = [];
  const losToProcess = loFilter
    ? module.learningOutcomes.filter(lo => loFilter.includes(lo.number))
    : module.learningOutcomes;

  for (let i = 0; i < losToProcess.length; i++) {
    const lo = losToProcess[i];
    console.log(`\n[${i + 1}/${losToProcess.length}] LO${lo.number}: ${lo.title}`);

    const content = await generateContentForLO(module, lo);

    if (content) {
      results.push(content);

      const filename = `${module.code}-LO${lo.number}.json`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(content, null, 2));

      console.log(`   ✅ Generated ${content.blocks.length} blocks`);
      console.log(`   💾 Saved: ${filename}`);
    }

    if (i < losToProcess.length - 1) await sleep(1000);
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`${'═'.repeat(60)}`);
  console.log(`🤖 AI CONTENT GENERATOR (Claude)`);
  console.log(`   Using your existing 13 Anthropic API keys!`);
  console.log(`${'═'.repeat(60)}\n`);

  if (!fs.existsSync(CURRICULUM_FILE)) {
    console.error(`❌ Curriculum not found: ${CURRICULUM_FILE}`);
    process.exit(1);
  }

  const curriculumData = JSON.parse(fs.readFileSync(CURRICULUM_FILE, 'utf-8'));

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

  console.log(`📖 Found ${modules.length} modules\n`);
  console.log(`🔑 ${API_KEYS.length} API keys available for rotation\n`);

  const args = process.argv.slice(2);
  const moduleCode = args[0]?.toUpperCase();
  const loNumbers = args.slice(1).map(n => parseInt(n)).filter(n => !isNaN(n));

  if (!moduleCode) {
    console.log(`Usage: npx ts-node scripts/ai-content-generator-anthropic.ts <MODULE_CODE> [LO_NUMBERS...]`);
    console.log(`\nExamples:`);
    console.log(`  npx ts-node scripts/ai-content-generator-anthropic.ts SWDML501`);
    console.log(`  npx ts-node scripts/ai-content-generator-anthropic.ts SWDML501 1 2\n`);
    console.log(`Available modules (first 20):`);
    modules.slice(0, 20).forEach(m => {
      console.log(`  ${m.code} - ${m.title} (${m.learningOutcomes.length} LOs)`);
    });
    process.exit(0);
  }

  const module = modules.find(m => m.code === moduleCode);
  if (!module) {
    console.error(`❌ Module ${moduleCode} not found`);
    process.exit(1);
  }

  const results = await generateContentForModule(module, loNumbers.length > 0 ? loNumbers : undefined);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎉 COMPLETE`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Module: ${module.code}`);
  console.log(`   • LOs Generated: ${results.length}`);
  console.log(`   • Total Blocks: ${results.reduce((sum, r) => sum + r.blocks.length, 0)}`);
  console.log(`   • Output: ${OUTPUT_DIR}\n`);
  console.log(`✨ Next: npx ts-node scripts/batch-content-seeder.ts ${module.code}\n`);
}

main().catch(console.error);
