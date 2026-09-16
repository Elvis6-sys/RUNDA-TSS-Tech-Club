#!/usr/bin/env ts-node
/**
 * UNIVERSAL CURRICULUM PARSER FOR RQF LEVEL 5 MODULES
 * 
 * This parser extracts ALL 4 LEVELS from any RQF Level 5 curriculum PDF:
 * Level 1: Learning Outcomes (LO)
 * Level 2: Topics (Major concepts)
 * Level 3: Subtopics (Indicative Content)
 * Level 4: Items (Detailed curriculum elements)
 * 
 * Works for ALL modules with standard RQF structure:
 * - SWDBF501 - Blockchain Fundamentals
 * - SWDBD401 - Backend Application Development
 * - SWDDD401 - Database Development
 * - And any other RQF Level 5 module
 * 
 * Usage: npx ts-node scripts/universal-curriculum-parser.ts <pdf-path> <trackId>
 * Example: npx ts-node scripts/universal-curriculum-parser.ts "7 Curriculum/.../SWDBF501 Blockchains Fundamentals.pdf" seed-track-blockchain-fundamentals
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════════════
// 📚 TYPES
// ══════════════════════════════════════════════════════════════════════

interface TOCItem {
  id: string;
  type: 'outcome' | 'topic' | 'subtopic' | 'item';
  title: string;
  parentId?: string;
  order: number;
  hours?: number;
  items?: string[]; // For backwards compatibility
}

interface ParsedCurriculum {
  moduleCode: string;
  moduleName: string;
  level: string;
  credit: string;
  outcomes: ParsedOutcome[];
}

interface ParsedOutcome {
  number: number;
  title: string;
  hours: number;
  topics: ParsedTopic[];
}

interface ParsedTopic {
  title: string;
  subtopics: ParsedSubtopic[];
}

interface ParsedSubtopic {
  title: string;
  items: string[];
}

// ══════════════════════════════════════════════════════════════════════
// 🔧 PDF TEXT EXTRACTION
// ══════════════════════════════════════════════════════════════════════

function extractTextFromPDF(pdfPath: string): string {
  try {
    // Check if pdftotext is installed
    try {
      execSync('which pdftotext', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  pdftotext not found. Installing poppler-utils...');
      console.log('   Run: sudo apt-get install poppler-utils (Ubuntu/Debian)');
      console.log('   Or: brew install poppler (macOS)');
      throw new Error('pdftotext not installed');
    }

    const outputPath = '/tmp/curriculum-text.txt';
    execSync(`pdftotext -layout "${pdfPath}" "${outputPath}"`);
    const text = fs.readFileSync(outputPath, 'utf-8');
    fs.unlinkSync(outputPath);
    return text;
  } catch (error) {
    console.error('❌ Failed to extract PDF text:', error);
    throw error;
  }
}

// ══════════════════════════════════════════════════════════════════════
// 🎯 CURRICULUM STRUCTURE PARSER
// ══════════════════════════════════════════════════════════════════════

function parseCurriculumStructure(text: string): ParsedCurriculum {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Extract module metadata
  const moduleCode = extractModuleCode(text);
  const moduleName = extractModuleName(text);
  const level = 'RQF Level 5';
  const credit = extractCredit(text);

  console.log(`\n📖 Parsing: ${moduleCode} - ${moduleName}`);
  console.log(`   Level: ${level}, Credit: ${credit}\n`);

  // Find learning outcomes section
  const outcomes: ParsedOutcome[] = [];
  let currentOutcome: ParsedOutcome | null = null;
  let currentTopic: ParsedTopic | null = null;
  let currentSubtopic: ParsedSubtopic | null = null;

  let inOutcomesSection = false;
  let inIndicativeContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Learning Outcomes section start
    if (line.match(/learning\s+outcome/i) && !line.match(/unit\s+learning\s+outcome/i)) {
      inOutcomesSection = true;
      continue;
    }

    // Detect indicative content section
    if (line.match(/indicative\s+content/i)) {
      inIndicativeContent = true;
      continue;
    }

    // Parse Learning Outcome (LO1, LO2, etc.)
    const loMatch = line.match(/^LO\s*(\d+)[:\s]*(.+?)(?:\s*\((\d+)\s*hours?\))?$/i);
    if (loMatch && inOutcomesSection) {
      if (currentOutcome) outcomes.push(currentOutcome);

      currentOutcome = {
        number: parseInt(loMatch[1]),
        title: loMatch[2].trim(),
        hours: loMatch[3] ? parseInt(loMatch[3]) : 10,
        topics: []
      };
      currentTopic = null;
      currentSubtopic = null;
      inIndicativeContent = false;
      console.log(`  📘 LO${currentOutcome.number}: ${currentOutcome.title} (${currentOutcome.hours}h)`);
      continue;
    }

    // Parse Topic (starts with number like "1.", "2.", etc.)
    const topicMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (topicMatch && currentOutcome && !inIndicativeContent) {
      if (currentTopic) currentOutcome.topics.push(currentTopic);

      currentTopic = {
        title: topicMatch[2].trim(),
        subtopics: []
      };
      currentSubtopic = null;
      console.log(`    📗 Topic: ${currentTopic.title}`);
      continue;
    }

    // Parse Subtopic (starts with letter like "a)", "b)", etc. or bullet)
    const subtopicMatch = line.match(/^(?:([a-z])\)|[•-])\s+(.+)$/i);
    if (subtopicMatch && currentTopic) {
      if (currentSubtopic) currentTopic.subtopics.push(currentSubtopic);

      currentSubtopic = {
        title: subtopicMatch[2].trim(),
        items: []
      };
      console.log(`      📙 Subtopic: ${currentSubtopic.title}`);
      continue;
    }

    // Parse Items (bullets or sub-bullets under subtopic)
    const itemMatch = line.match(/^(?:[-•▪○]\s+|(?:i{1,3}|iv|v|vi{1,3}|ix|x)\.\s+)(.+)$/i);
    if (itemMatch && currentSubtopic) {
      const item = itemMatch[1].trim();
      if (item.length > 3 && !item.match(/^learning outcome/i)) {
        currentSubtopic.items.push(item);
        console.log(`        📄 Item: ${item}`);
      }
      continue;
    }

    // Alternative: detect items by indentation (if they're indented under subtopic)
    if (currentSubtopic && line.length > 5 && line.match(/^\s{2,}/)) {
      const item = line.trim();
      if (!item.match(/^([a-z]\)|[•-]|\d+\.)/i) && item.length > 3) {
        currentSubtopic.items.push(item);
        console.log(`        📄 Item: ${item}`);
      }
    }
  }

  // Push last items
  if (currentSubtopic && currentTopic) currentTopic.subtopics.push(currentSubtopic);
  if (currentTopic && currentOutcome) currentOutcome.topics.push(currentTopic);
  if (currentOutcome) outcomes.push(currentOutcome);

  return {
    moduleCode,
    moduleName,
    level,
    credit,
    outcomes
  };
}

function extractModuleCode(text: string): string {
  const match = text.match(/(?:module\s+code|code)[:\s]*([A-Z]{3,}[A-Z0-9]{3,})/i);
  return match ? match[1] : 'UNKNOWN';
}

function extractModuleName(text: string): string {
  const match = text.match(/(?:module\s+title|title)[:\s]*(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : 'Unknown Module';
}

function extractCredit(text: string): string {
  const match = text.match(/(?:credit)[:\s]*(\d+)/i);
  return match ? match[1] : '10';
}

// ══════════════════════════════════════════════════════════════════════
// 🗂️ TOC GENERATOR (All 4 Levels)
// ══════════════════════════════════════════════════════════════════════

function generateTOC(parsed: ParsedCurriculum): TOCItem[] {
  const toc: TOCItem[] = [];
  let globalOrder = 0;

  parsed.outcomes.forEach((outcome, oIdx) => {
    const outcomeId = `outcome-${oIdx}`;

    // Level 1: Learning Outcome
    toc.push({
      id: outcomeId,
      type: 'outcome',
      title: outcome.title,
      order: globalOrder++,
      hours: outcome.hours
    });

    outcome.topics.forEach((topic, tIdx) => {
      const topicId = `topic-${oIdx}-${tIdx}`;

      // Level 2: Topic
      toc.push({
        id: topicId,
        type: 'topic',
        title: topic.title,
        parentId: outcomeId,
        order: globalOrder++
      });

      topic.subtopics.forEach((subtopic, sIdx) => {
        const subtopicId = `subtopic-${oIdx}-${tIdx}-${sIdx}`;

        // Level 3: Subtopic (Indicative Content)
        toc.push({
          id: subtopicId,
          type: 'subtopic',
          title: subtopic.title,
          parentId: topicId,
          order: globalOrder++,
          items: subtopic.items.length > 0 ? subtopic.items : undefined
        });

        // Level 4: Items (NEW!)
        subtopic.items.forEach((item, iIdx) => {
          const itemId = `item-${oIdx}-${tIdx}-${sIdx}-${iIdx}`;

          toc.push({
            id: itemId,
            type: 'item',
            title: item,
            parentId: subtopicId,
            order: globalOrder++
          });
        });
      });
    });
  });

  return toc;
}

// ══════════════════════════════════════════════════════════════════════
// 📊 STATISTICS
// ══════════════════════════════════════════════════════════════════════

function printStatistics(toc: TOCItem[]) {
  const stats = {
    outcomes: toc.filter(t => t.type === 'outcome').length,
    topics: toc.filter(t => t.type === 'topic').length,
    subtopics: toc.filter(t => t.type === 'subtopic').length,
    items: toc.filter(t => t.type === 'item').length
  };

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('📊 CURRICULUM STRUCTURE STATISTICS');
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(`  Level 1 (Learning Outcomes): ${stats.outcomes}`);
  console.log(`  Level 2 (Topics): ${stats.topics}`);
  console.log(`  Level 3 (Subtopics): ${stats.subtopics}`);
  console.log(`  Level 4 (Items): ${stats.items} ← NOW INCLUDED!`);
  console.log(`  Total TOC Entries: ${toc.length}`);
  console.log('══════════════════════════════════════════════════════════════════════\n');

  return stats;
}

// ══════════════════════════════════════════════════════════════════════
// 💾 DATABASE UPDATE
// ══════════════════════════════════════════════════════════════════════

async function updateTrackTOC(trackId: string, toc: TOCItem[], moduleCode: string) {
  try {
    console.log(`💾 Updating track: ${trackId}`);

    const track = await prisma.skillTrack.findUnique({
      where: { id: trackId }
    });

    if (!track) {
      console.log(`❌ Track not found: ${trackId}`);
      return false;
    }

    await prisma.skillTrack.update({
      where: { id: trackId },
      data: {
        tableOfContents: toc as any
      }
    });

    console.log(`✅ Track TOC updated successfully!`);
    return true;

  } catch (error) {
    console.error('❌ Database update failed:', error);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════
// 🚀 MAIN EXECUTION
// ══════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx ts-node scripts/universal-curriculum-parser.ts <pdf-path> <trackId>');
    console.log('\nExample:');
    console.log('  npx ts-node scripts/universal-curriculum-parser.ts \\');
    console.log('    "7 Curriculum/RQF LEVEL 5 SoftWare_Development curriculum PDF/Specific Modules/SWDBF501 Blockchains Fundamentals.pdf" \\');
    console.log('    seed-track-blockchain-fundamentals');
    console.log('\nAvailable for ALL RQF Level 5 modules with standard structure!');
    process.exit(1);
  }

  const [pdfPath, trackId] = args;

  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🎓 UNIVERSAL RQF LEVEL 5 CURRICULUM PARSER');
  console.log('   Extracts ALL 4 LEVELS from curriculum PDFs');
  console.log('══════════════════════════════════════════════════════════════════════');

  // Resolve path
  const fullPath = path.isAbsolute(pdfPath) ? pdfPath : path.join(process.cwd(), pdfPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ PDF not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`\n📄 PDF: ${path.basename(fullPath)}`);
  console.log(`🎯 Track: ${trackId}\n`);

  try {
    // Step 1: Extract text
    console.log('📖 Step 1: Extracting text from PDF...');
    const text = extractTextFromPDF(fullPath);
    console.log(`   ✅ Extracted ${text.length} characters\n`);

    // Step 2: Parse structure
    console.log('🔍 Step 2: Parsing curriculum structure...');
    const parsed = parseCurriculumStructure(text);

    // Step 3: Generate TOC
    console.log('\n🗂️  Step 3: Generating 4-level TOC...');
    const toc = generateTOC(parsed);

    // Step 4: Statistics
    const stats = printStatistics(toc);

    // Step 5: Update database
    if (stats.items === 0) {
      console.log('⚠️  WARNING: No Level 4 items found!');
      console.log('   The PDF may not have detailed item-level content,');
      console.log('   or the parsing patterns need adjustment.');
      console.log('\n   Proceeding with 3-level structure...\n');
    }

    console.log('💾 Step 4: Updating database...');
    const success = await updateTrackTOC(trackId, toc, parsed.moduleCode);

    if (success) {
      console.log('\n══════════════════════════════════════════════════════════════════════');
      console.log('✅ SUCCESS!');
      console.log('══════════════════════════════════════════════════════════════════════');
      console.log(`   Module: ${parsed.moduleCode} - ${parsed.moduleName}`);
      console.log(`   Outcomes: ${stats.outcomes}`);
      console.log(`   Topics: ${stats.topics}`);
      console.log(`   Subtopics: ${stats.subtopics}`);
      console.log(`   Items: ${stats.items}`);
      console.log('\n🎨 View at:');
      console.log(`   http://localhost:3001/passport/teach/${trackId}`);
      console.log('══════════════════════════════════════════════════════════════════════\n');

      // Save parsed structure for reference
      const outputPath = `parsed-${parsed.moduleCode}.json`;
      fs.writeFileSync(outputPath, JSON.stringify({ parsed, toc }, null, 2));
      console.log(`📁 Parsed structure saved to: ${outputPath}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
