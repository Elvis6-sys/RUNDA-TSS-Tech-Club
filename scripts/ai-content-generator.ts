#!/usr/bin/env ts-node
/**
 * AI CONTENT GENERATOR
 * 
 * Uses GPT-4 to generate interactive, engaging learning content for each learning outcome
 * from the cleaned curriculum data.
 * 
 * Features:
 * - Generates 12 block types (text, code, quiz, video, diagram, callout, tabs, accordion, etc.)
 * - Curriculum-aligned content
 * - Interactive elements (quizzes, exercises, code examples)
 * - Multimedia suggestions (images, videos, diagrams)
 * - UX-optimized structure
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

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
  type: 'text' | 'code' | 'quiz' | 'video' | 'image' | 'callout' | 'tabs' | 'accordion' | 'checklist' | 'diagram' | 'embed' | 'interactive';
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
const API_KEYS = [
  process.env.ANTHROPIC_API_KEY_1,
  process.env.ANTHROPIC_API_KEY_2,
  process.env.ANTHROPIC_API_KEY_3,
  process.env.ANTHROPIC_API_KEY_4,
  process.env.ANTHROPIC_API_KEY_5,
  process.env.ANTHROPIC_API_KEY_6,
  process.env.ANTHROPIC_API_KEY_7,
  process.env.ANTHROPIC_API_KEY_8,
  process.env.ANTHROPIC_API_KEY_9,
  process.env.ANTHROPIC_API_KEY_10,
  process.env.ANTHROPIC_API_KEY_11,
  process.env.ANTHROPIC_API_KEY_12,
  process.env.ANTHROPIC_API_KEY_13,
].filter(Boolean) as string[];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════════
// API KEY ROTATION
// ═══════════════════════════════════════════════════════════════════════════

let currentKeyIndex = 0;

function getOpenAIClient(): OpenAI {
  if (API_KEYS.length === 0) {
    throw new Error('No OpenAI API keys found in .env');
  }

  const apiKey = API_KEYS[currentKeyIndex];
  return new OpenAI({ apiKey });
}

function rotateAPIKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`🔄 Rotated to API key ${currentKeyIndex + 1}/${API_KEYS.length}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT GENERATION PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

function buildContentPrompt(module: CurriculumModule, lo: LearningOutcome): string {
  return `You are an expert instructional designer creating interactive, engaging learning content for TVET education.

**Module**: ${module.code} - ${module.title}
**Level**: ${module.level}
**Department**: ${module.department}

**Learning Outcome ${lo.number}**: ${lo.title}

${lo.performanceCriteria ? `**Performance Criteria**:
${lo.performanceCriteria.map((pc, i) => `${i + 1}. ${pc}`).join('\n')}` : ''}

**Your Task**: Generate comprehensive, interactive learning content that:
1. **Engages students** with varied content types (text, code, quizzes, visuals)
2. **Follows UX best practices** (clear hierarchy, scannable, interactive)
3. **Includes multimedia** (suggest images, videos, diagrams)
4. **Provides practice** (code examples, quizzes, exercises)
5. **Aligns with curriculum** (covers all performance criteria)

**Content Structure** (generate 15-25 blocks):

1. **Introduction** (2-3 blocks)
   - Hook/overview text block
   - Learning objectives callout
   - Real-world application example

2. **Core Content** (8-12 blocks)
   - Concept explanations (text blocks with headers)
   - Code examples (with syntax highlighting)
   - Visual aids (image/diagram blocks with descriptions)
   - Interactive demonstrations (embedded content)
   - Comparison tables (tabs or accordion)

3. **Practice & Assessment** (3-5 blocks)
   - Knowledge check quiz (MCQ, True/False)
   - Hands-on exercise (code challenge or checklist)
   - Summary callout

4. **Resources** (2-3 blocks)
   - Video tutorial suggestions
   - Further reading links
   - Next steps

**Block Types Available**:
- \`text\`: Markdown-formatted explanations (use ## headers, **bold**, lists)
- \`code\`: Code snippets with language and optional runnable flag
- \`quiz\`: Interactive quizzes (MCQ, True/False, fill-in)
- \`callout\`: Highlighted tips, warnings, notes (type: info|warning|success|tip)
- \`image\`: Image with caption and alt text (provide description)
- \`video\`: YouTube/external video embed (provide title and URL suggestion)
- \`tabs\`: Tabbed content for comparisons/alternatives
- \`accordion\`: Collapsible sections for detailed info
- \`checklist\`: Task lists for hands-on exercises
- \`diagram\`: Mermaid diagrams or architecture visualizations
- \`embed\`: External interactive content
- \`interactive\`: Custom interactive components

**Response Format** (JSON):
\`\`\`json
{
  "blocks": [
    {
      "id": "swdml501-lo1-b1",
      "type": "text",
      "content": "## Introduction to Data Preprocessing\\n\\nData preprocessing is..."
    },
    {
      "id": "swdml501-lo1-b2",
      "type": "callout",
      "calloutType": "tip",
      "title": "Why Preprocessing Matters",
      "content": "Clean data leads to better model accuracy..."
    },
    {
      "id": "swdml501-lo1-b3",
      "type": "code",
      "language": "python",
      "code": "import pandas as pd\\ndf = pd.read_csv('data.csv')\\ndf.head()",
      "caption": "Loading data with Pandas",
      "runnable": true
    },
    {
      "id": "swdml501-lo1-b4",
      "type": "quiz",
      "title": "Quick Check",
      "questions": [
        {
          "id": "q1",
          "type": "mcq",
          "question": "What is the purpose of data preprocessing?",
          "options": ["Clean data", "Visualize data", "Store data", "Delete data"],
          "correctAnswer": 0,
          "explanation": "Preprocessing cleans and prepares data for analysis"
        }
      ]
    },
    {
      "id": "swdml501-lo1-b5",
      "type": "image",
      "url": "/placeholder-diagram.png",
      "alt": "Data preprocessing pipeline diagram",
      "caption": "The data preprocessing workflow",
      "description": "Diagram showing: Raw Data → Cleaning → Transformation → Prepared Data"
    }
  ],
  "estimatedTime": "45-60 minutes",
  "metadata": {
    "difficulty": "intermediate",
    "prerequisites": ["Basic Python", "NumPy fundamentals"],
    "interactiveElements": 3,
    "multimediaCount": 2
  }
}
\`\`\`

**Requirements**:
- Block IDs follow format: \`{moduleCode}-lo{loNumber}-b{blockNumber}\`
- All quiz questions have explanations
- Code blocks specify language (python, javascript, java, sql, etc.)
- Images include descriptive captions and alt text
- Content is broken into scannable chunks (no walls of text)
- Mix content types for engagement
- Include at least 2 quizzes and 3 code examples
- Suggest relevant video topics (no specific URLs if unknown)

Generate the content now:`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateContentForLO(
  module: CurriculumModule,
  lo: LearningOutcome,
  retries = 3
): Promise<GeneratedContent | null> {
  const prompt = buildContentPrompt(module, lo);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getOpenAIClient();

      console.log(`   🤖 Generating content (attempt ${attempt}/${retries})...`);

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert instructional designer creating interactive TVET educational content. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from API');
      }

      const parsed = JSON.parse(content);

      // Validate structure
      if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
        throw new Error('Invalid response structure: missing blocks array');
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

      if (error.status === 429 && attempt < retries) {
        console.log(`   ⏳ Rate limited. Rotating API key and retrying...`);
        rotateAPIKey();
        await sleep(2000);
        continue;
      }

      if (attempt === retries) {
        console.error(`   ❌ All attempts failed for ${module.code} LO${lo.number}`);
        return null;
      }

      await sleep(1000 * attempt);
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

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

      // Save immediately
      const filename = `${module.code}-LO${lo.number}.json`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(content, null, 2));

      console.log(`   ✅ Generated ${content.blocks.length} blocks`);
      console.log(`   💾 Saved to: ${filename}`);
    }

    // Rate limiting: wait between requests
    if (i < losToProcess.length - 1) {
      await sleep(1000);
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`${'═'.repeat(60)}`);
  console.log(`🤖 AI CONTENT GENERATOR`);
  console.log(`   Curriculum-aligned interactive learning content`);
  console.log(`${'═'.repeat(60)}\n`);

  // Load curriculum
  if (!fs.existsSync(CURRICULUM_FILE)) {
    console.error(`❌ Curriculum file not found: ${CURRICULUM_FILE}`);
    process.exit(1);
  }

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

  console.log(`📖 Loaded ${modules.length} modules from curriculum\n`);

  // Command line args
  const args = process.argv.slice(2);
  const moduleCode = args[0]?.toUpperCase();
  const loNumbers = args.slice(1).map(n => parseInt(n)).filter(n => !isNaN(n));

  if (!moduleCode) {
    console.log(`Usage: npx ts-node scripts/ai-content-generator.ts <MODULE_CODE> [LO_NUMBERS...]`);
    console.log(`\nExamples:`);
    console.log(`  npx ts-node scripts/ai-content-generator.ts SWDML501`);
    console.log(`  npx ts-node scripts/ai-content-generator.ts SWDML501 1 2 3\n`);
    console.log(`Available modules (first 20):`);
    modules.slice(0, 20).forEach(m => {
      console.log(`  ${m.code} - ${m.title} (${m.learningOutcomes.length} LOs)`);
    });
    console.log(`\n... and ${modules.length - 20} more modules\n`);
    process.exit(0);
  }

  const module = modules.find(m => m.code === moduleCode);
  if (!module) {
    console.error(`❌ Module ${moduleCode} not found in curriculum`);
    process.exit(1);
  }

  // Generate content
  const results = await generateContentForModule(module, loNumbers.length > 0 ? loNumbers : undefined);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎉 GENERATION COMPLETE`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`\n📊 Summary:`);
  console.log(`   • Module: ${module.code}`);
  console.log(`   • Learning Outcomes: ${results.length}`);
  console.log(`   • Total Blocks: ${results.reduce((sum, r) => sum + r.blocks.length, 0)}`);
  console.log(`   • Output Directory: ${OUTPUT_DIR}\n`);
  console.log(`✨ Next step: Run the seeder to upload to database\n`);
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
