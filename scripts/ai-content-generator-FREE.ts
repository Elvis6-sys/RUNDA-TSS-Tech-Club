#!/usr/bin/env ts-node
/**
 * AI CONTENT GENERATOR (100% FREE - Using Groq)
 * 
 * Uses your 13 FREE Groq API keys - NO COST, UNLIMITED!
 * Groq is FASTER than GPT-4 and completely free!
 */

import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
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
  type: string;
  [key: string]: any;
}

interface GeneratedContent {
  moduleCode: string;
  learningOutcome: LearningOutcome;
  blocks: ContentBlock[];
  estimatedTime: string;
  metadata: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CURRICULUM_FILE = path.join(__dirname, '..', 'lib', 'curriculum-data', 'curriculum-all.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'generated-content');

// Use your 13 FREE Groq API keys
const API_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7,
  process.env.GROQ_API_KEY_8,
  process.env.GROQ_API_KEY_9,
  process.env.GROQ_API_KEY_10,
  process.env.GROQ_API_KEY_11,
  process.env.GROQ_API_KEY_12,
  process.env.GROQ_API_KEY_13,
].filter(Boolean) as string[];

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════════════════

let currentKeyIndex = 0;

function getGroqClient(): Groq {
  if (API_KEYS.length === 0) {
    throw new Error('No Groq API keys found in .env');
  }
  const apiKey = API_KEYS[currentKeyIndex];
  return new Groq({ apiKey });
}

function rotateAPIKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`🔄 Key ${currentKeyIndex + 1}/${API_KEYS.length}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT GENERATION PROMPT
// ═══════════════════════════════════════════════════════════════════════════

function buildPrompt(module: CurriculumModule, lo: LearningOutcome): string {
  return `Generate interactive TVET learning content in JSON format.

Module: ${module.code} - ${module.title}
Level: ${module.level}
Learning Outcome ${lo.number}: ${lo.title}
${lo.performanceCriteria ? `Performance Criteria: ${lo.performanceCriteria.join('; ')}` : ''}

Create 15-20 interactive blocks with these types:
- text: Markdown explanations with ## headers
- code: Code examples (Python/Java/SQL) with language & caption
- quiz: MCQ/True-False questions with explanations
- callout: Tips/warnings (calloutType: tip|warning|info)
- image: Diagrams with captions
- checklist: Exercise tasks

Block ID format: ${module.code.toLowerCase()}-lo${lo.number}-bN

Respond ONLY with this JSON (no markdown, no extra text):
{
  "blocks": [
    {"id":"${module.code.toLowerCase()}-lo${lo.number}-b1","type":"text","content":"## Introduction\\nExplanation..."},
    {"id":"${module.code.toLowerCase()}-lo${lo.number}-b2","type":"code","language":"python","code":"print('hello')","caption":"Example"},
    {"id":"${module.code.toLowerCase()}-lo${lo.number}-b3","type":"quiz","questions":[{"id":"q1","type":"mcq","question":"What is...?","options":["A","B","C"],"correctAnswer":0,"explanation":"Because..."}]}
  ],
  "estimatedTime":"45-60 minutes",
  "metadata":{"difficulty":"intermediate","prerequisites":[],"interactiveElements":3,"multimediaCount":2}
}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateContentForLO(
  module: CurriculumModule,
  lo: LearningOutcome
): Promise<GeneratedContent | null> {
  const prompt = buildPrompt(module, lo);
  
  for (let attempt = 1; attempt <= API_KEYS.length; attempt++) {
    try {
      const client = getGroqClient();
      
      console.log(`   🤖 Generating (${attempt}/${API_KEYS.length})...`);
      
      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',  // Fast & smart
        messages: [
          {
            role: 'system',
            content: 'You are an expert instructional designer. Respond with ONLY valid JSON, no markdown or extra text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      let content = response.choices[0].message.content || '';
      
      // Extract JSON
      content = content.trim();
      if (content.startsWith('```json')) content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      else if (content.startsWith('```')) content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');

      const parsed = JSON.parse(content);
      
      if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
        throw new Error('Invalid structure');
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
      console.error(`   ❌ Failed:`, error.message);
      
      if ((error.status === 429 || error.code === 'rate_limit_exceeded') && attempt < API_KEYS.length) {
        rotateAPIKey();
        await sleep(1000);
        continue;
      }
      
      if (attempt === API_KEYS.length) return null;
      await sleep(500 * attempt);
    }
  }
  
  return null;
}

async function generateForModule(
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
      fs.writeFileSync(
        path.join(OUTPUT_DIR, filename),
        JSON.stringify(content, null, 2)
      );
      
      console.log(`   ✅ ${content.blocks.length} blocks → ${filename}`);
    }
    
    if (i < losToProcess.length - 1) await sleep(500);
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`${'═'.repeat(60)}`);
  console.log(`🤖 AI CONTENT GENERATOR (100% FREE)`);
  console.log(`   Powered by Groq - Faster & Free!`);
  console.log(`${'═'.repeat(60)}\n`);

  if (!fs.existsSync(CURRICULUM_FILE)) {
    console.error(`❌ Curriculum not found`);
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

  console.log(`📖 ${modules.length} modules available`);
  console.log(`🔑 ${API_KEYS.length} FREE Groq API keys\n`);

  const args = process.argv.slice(2);
  const moduleCode = args[0]?.toUpperCase();
  const loNumbers = args.slice(1).map(n => parseInt(n)).filter(n => !isNaN(n));

  if (!moduleCode) {
    console.log(`Usage: npm run generate <MODULE_CODE> [LO_NUMBERS...]`);
    console.log(`\nExamples:`);
    console.log(`  npm run generate SWDML501`);
    console.log(`  npm run generate SWDML501 1 2\n`);
    console.log(`First 20 modules:`);
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

  const results = await generateForModule(module, loNumbers.length > 0 ? loNumbers : undefined);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎉 COMPLETE`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n📊 Results:`);
  console.log(`   • Module: ${module.code}`);
  console.log(`   • LOs: ${results.length}`);
  console.log(`   • Blocks: ${results.reduce((s, r) => s + r.blocks.length, 0)}`);
  console.log(`   • Output: ${OUTPUT_DIR}\n`);
  console.log(`✨ Next: npm run seed ${module.code}\n`);
}

main().catch(console.error);
