#!/usr/bin/env ts-node
/**
 * CURRICULUM INTELLIGENCE SYSTEM
 * 
 * Automatically analyzes RTB/TVET curriculum PDFs and generates ultra-modern content.
 * NO fine-tuning needed - uses prompt engineering to understand RTB/TVET structure.
 * 
 * Usage:
 *   # Generate from single PDF
 *   npm run curriculum-ai generate "path/to/SWDNEW501.pdf"
 * 
 *   # Batch process entire folder
 *   npm run curriculum-ai batch "7 Curriculum/.../Specific Modules"
 * 
 *   # List available curricula
 *   npm run curriculum-ai list
 */

import Groq from 'groq-sdk';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// RTB/TVET Curriculum Structure
interface Curriculum {
  moduleCode: string;
  moduleName: string;
  level: string;
  credits: number;
  theoryPct: number;
  practicalPct: number;
  learningOutcomes: LearningOutcome[];
}

interface LearningOutcome {
  number: number;
  title: string;
  performanceCriteria: string[];
  indicativeContent: Topic[];
}

interface Topic {
  title: string;
  subtopics: string[];
}

// ============================================================================
// PHASE 1: PDF PARSING with pdftotext
// ============================================================================

function extractPDFText(pdfPath: string): string {
  try {
    return execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf-8' });
  } catch (error) {
    throw new Error('PDF extraction failed. Install: sudo apt install poppler-utils');
  }
}

// ============================================================================
// PHASE 2: AI-POWERED CURRICULUM ANALYSIS
// ============================================================================

async function parseCurriculumStructure(pdfText: string, filename: string): Promise<Curriculum> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_7 || process.env.GROQ_API_KEY_1 });

  const systemPrompt = `You are an expert at parsing RTB/TVET curriculum documents from Rwanda.

RTB/TVET STANDARD FORMAT:
1. Header: Module code (SWDXXX501), name, level (RQF Level 4/5), credits, theory/practical %
2. Learning Outcomes (usually 4): Each has title, performance criteria, indicative content
3. Indicative Content: Organized as topics with subtopics

EXTRACTION RULES:
- Module code is always 8-9 characters: SWDXX501 or similar
- LO titles start with action verbs: "Design...", "Develop...", "Apply..."
- Performance criteria are numbered bullet points under each LO
- Indicative content lists topics and their sub-items
- Theory/Practical split is usually 30/70, 40/60, or 50/50

Return clean JSON only.`;

  const userPrompt = `Parse this RTB/TVET curriculum and extract structure as JSON:

FILENAME: ${filename}

CURRICULUM TEXT (first 12KB):
${pdfText.substring(0, 12000)}

Return JSON:
{
  "moduleCode": "SWDXXX501",
  "moduleName": "...",
  "level": "RQF Level 5",
  "credits": 10,
  "theoryPct": 40,
  "practicalPct": 60,
  "learningOutcomes": [
    {
      "number": 1,
      "title": "...",
      "performanceCriteria": ["...", "..."],
      "indicativeContent": [
        {"title": "Topic 1", "subtopics": ["...", "..."]},
        {"title": "Topic 2", "subtopics": ["...", "..."]}
      ]
    }
  ]
}`;

  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content || '{}';
  return JSON.parse(content);
}

// ============================================================================
// PHASE 3: DATABASE TRACK CREATION
// ============================================================================

async function createTrackFromCurriculum(curr: Curriculum): Promise<string> {
  const trackId = `seed-track-${curr.moduleCode.toLowerCase()}`;

  // Build Table of Contents (4-level hierarchy)
  const toc: any[] = [];

  curr.learningOutcomes.forEach((lo, loIdx) => {
    // Level 1: Learning Outcome
    const loId = `lo${lo.number}`;
    toc.push({
      id: loId,
      type: 'outcome',
      title: lo.title,
      order: loIdx,
    });

    // Level 2: Topics
    lo.indicativeContent.forEach((topic, topicIdx) => {
      const topicId = `${loId}-topic${topicIdx + 1}`;
      toc.push({
        id: topicId,
        type: 'topic',
        title: topic.title,
        parentId: loId,
        order: topicIdx,
      });

      // Level 3: Subtopics
      topic.subtopics.forEach((subtopic, subIdx) => {
        const subtopicId = `${topicId}-sub${subIdx + 1}`;
        toc.push({
          id: subtopicId,
          type: 'subtopic',
          title: subtopic,
          parentId: topicId,
          order: subIdx,
        });

        // Level 4: Auto-generate items (clickable leaf nodes)
        // For now, create 3-5 items per subtopic based on complexity
        const itemCount = subtopic.length > 50 ? 5 : 3;
        for (let i = 0; i < itemCount; i++) {
          toc.push({
            id: `${subtopicId}-item${i + 1}`,
            type: 'item',
            title: `${subtopic} - Part ${i + 1}`,
            parentId: subtopicId,
            order: i,
          });
        }
      });
    });
  });

  // Upsert track
  // AUTO-DETECT department from module code
  const getDepartmentFromModuleCode = (code: string): string | null => {
    const c = code.toUpperCase();
    if (c.startsWith('SWD')) return 'software-development';
    if (c.startsWith('CSA') || c.startsWith('NET') || c.startsWith('SYS')) return 'computer-systems-architecture';
    if (c.startsWith('LSV') || c.startsWith('GEO') || c.startsWith('MAP')) return 'land-surveying';
    if (c.startsWith('BLD') || c.startsWith('CON') || c.startsWith('CIV')) return 'building-construction';
    return null;
  };

  const department = getDepartmentFromModuleCode(curr.moduleCode);

  await prisma.skillTrack.upsert({
    where: { id: trackId },
    create: {
      id: trackId,
      name: curr.moduleName,
      description: `${curr.moduleCode} - ${curr.moduleName} (${curr.level})`,
      department, // AUTO-TAGGED!
      tableOfContents: toc,
      tier: 'premium',
      order: 0,
    },
    update: {
      name: curr.moduleName,
      description: `${curr.moduleCode} - ${curr.moduleName} (${curr.level})`,
      department, // AUTO-TAGGED!
      tableOfContents: toc,
    },
  });

  return trackId;
}

// ============================================================================
// PHASE 4: CONTENT GENERATION
// ============================================================================

async function generateContent(trackId: string, loId: string): Promise<void> {
  console.log(`      🤖 Generating ultra-modern content for ${loId}...`);

  try {
    execSync(
      `npm run hierarchical-generate full ${trackId} null ${loId}`,
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        encoding: 'utf-8'
      }
    );
  } catch (error) {
    console.error(`      ❌ Generation failed for ${loId}`);
  }
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

async function processOneCurriculum(pdfPath: string): Promise<void> {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🧠 CURRICULUM INTELLIGENCE - Processing PDF');
  console.log('════════════════════════════════════════════════════════════════');
  console.log();

  const fullPath = path.resolve(pdfPath);
  const filename = path.basename(pdfPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${pdfPath}`);
    return;
  }

  console.log(`📄 File: ${filename}`);
  console.log();

  // Step 1: Extract PDF text
  console.log('1️⃣  Extracting PDF text...');
  const pdfText = extractPDFText(fullPath);
  console.log(`   ✅ Extracted ${Math.round(pdfText.length / 1024)}KB`);
  console.log();

  // Step 2: Parse curriculum structure using AI
  console.log('2️⃣  Analyzing curriculum structure with AI...');
  const curriculum = await parseCurriculumStructure(pdfText, filename);
  console.log(`   ✅ Module: ${curriculum.moduleCode} - ${curriculum.moduleName}`);
  console.log(`   ✅ Level: ${curriculum.level}`);
  console.log(`   ✅ Learning Outcomes: ${curriculum.learningOutcomes.length}`);
  console.log(`   ✅ Theory/Practical: ${curriculum.theoryPct}%/${curriculum.practicalPct}%`);
  console.log();

  // Step 3: Create database track
  console.log('3️⃣  Creating SkillTrack in database...');
  const trackId = await createTrackFromCurriculum(curriculum);
  console.log(`   ✅ Track ID: ${trackId}`);
  console.log();

  // Step 4: Generate content for each LO
  console.log('4️⃣  Generating ultra-modern interactive content...');
  console.log(`   Total LOs to process: ${curriculum.learningOutcomes.length}`);
  console.log();

  for (const lo of curriculum.learningOutcomes) {
    console.log(`   📚 LO${lo.number}: ${lo.title}`);
    console.log(`      Topics: ${lo.indicativeContent.length}`);
    console.log(`      Performance Criteria: ${lo.performanceCriteria.length}`);
    console.log();

    await generateContent(trackId, `lo${lo.number}`);

    console.log(`   ✅ LO${lo.number} complete!`);
    console.log();
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('🎉 CURRICULUM PROCESSING COMPLETE!');
  console.log('════════════════════════════════════════════════════════════════');
  console.log();
  console.log(`📊 Summary:`);
  console.log(`   • Module: ${curriculum.moduleCode}`);
  console.log(`   • Name: ${curriculum.moduleName}`);
  console.log(`   • Learning Outcomes: ${curriculum.learningOutcomes.length}`);
  console.log(`   • Track ID: ${trackId}`);
  console.log();
  console.log(`🔗 View Content:`);
  console.log(`   Teacher: http://localhost:3001/passport/teach/${trackId}`);
  console.log(`   Student: http://localhost:3001/learn/${trackId}`);
  console.log();
}

async function batchProcessFolder(folderPath: string): Promise<void> {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('📦 BATCH CURRICULUM PROCESSING');
  console.log('════════════════════════════════════════════════════════════════');
  console.log();

  const fullPath = path.resolve(folderPath);
  const pdfFiles = fs.readdirSync(fullPath)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(fullPath, f));

  console.log(`📚 Found ${pdfFiles.length} curriculum PDFs`);
  console.log();

  for (let i = 0; i < pdfFiles.length; i++) {
    console.log(`[${i + 1}/${pdfFiles.length}] Processing: ${path.basename(pdfFiles[i])}`);
    console.log();

    try {
      await processOneCurriculum(pdfFiles[i]);
    } catch (error: any) {
      console.error(`❌ Failed: ${error.message}`);
      console.error(error.stack);
    }

    if (i < pdfFiles.length - 1) {
      console.log('⏳ Cooldown (30 seconds before next module)...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      console.log();
    }
  }

  console.log('════════════════════════════════════════════════════════════════');
  console.log('🎉 BATCH PROCESSING COMPLETE!');
  console.log(`   Processed ${pdfFiles.length} curricula`);
  console.log('════════════════════════════════════════════════════════════════');
}

function listAvailableCurricula(): void {
  const curriculumFolders = [
    '7 Curriculum/RQF LEVEL 4 SoftWare_Development curriculum PDF/Specific Modules',
    '7 Curriculum/RQF LEVEL 5 SoftWare_Development curriculum PDF/Specific Modules',
  ];

  console.log('📚 Available RTB/TVET Curricula:\n');

  curriculumFolders.forEach(folder => {
    const fullPath = path.join(process.cwd(), folder);
    if (fs.existsSync(fullPath)) {
      const pdfs = fs.readdirSync(fullPath).filter(f => f.endsWith('.pdf'));
      console.log(`${folder}:`);
      pdfs.forEach(pdf => console.log(`  • ${pdf}`));
      console.log();
    }
  });
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const [command, arg] = process.argv.slice(2);

  if (!command) {
    console.log(`
🧠 CURRICULUM INTELLIGENCE SYSTEM
═══════════════════════════════════════════════════════════════════════════

Automatically analyze ANY RTB/TVET curriculum PDF and generate ultra-modern content.

COMMANDS:

  generate <pdf-path>
    Process a single curriculum PDF and generate all content.
    
    Example:
      npm run curriculum-ai generate "7 Curriculum/.../SWDML501 Machine Learning.pdf"

  batch <folder-path>
    Process all PDFs in a folder.
    
    Example:
      npm run curriculum-ai batch "7 Curriculum/.../Specific Modules"

  list
    Show all available curricula.

═══════════════════════════════════════════════════════════════════════════

HOW IT WORKS:
  1. Extracts text from PDF
  2. AI analyzes RTB/TVET structure (LOs, Performance Criteria, Indicative Content)
  3. Creates SkillTrack in database with 4-level hierarchy
  4. Generates ultra-modern interactive content (Duolingo-grade)
  5. Ready for students & teachers!

NO MANUAL WORK NEEDED! Just drop in a curriculum PDF and go. ☕
    `);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'generate':
        if (!arg) {
          console.error('❌ Please provide PDF path');
          console.log('Usage: npm run curriculum-ai generate <pdf-path>');
          process.exit(1);
        }
        await processOneCurriculum(arg);
        break;

      case 'batch':
        if (!arg) {
          console.error('❌ Please provide folder path');
          console.log('Usage: npm run curriculum-ai batch <folder-path>');
          process.exit(1);
        }
        await batchProcessFolder(arg);
        break;

      case 'list':
        listAvailableCurricula();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { processOneCurriculum, batchProcessFolder };
