#!/usr/bin/env ts-node
/**
 * RQF LEVEL 5 CURRICULUM PARSER - REFINED VERSION
 * 
 * Correctly extracts ALL 4 LEVELS from RQF curriculum PDFs:
 * Level 1: Learning Outcomes (LO1, LO2, etc.)
 * Level 2: Topics (● bullets)
 * Level 3: Subtopics (✓ checkmarks)
 * Level 4: Items (plain text under subtopics)
 * 
 * Format detected in SWDBF501 Blockchains Fundamentals.pdf:
 * Learning outcome 1: Design blockchain system architecture (10 hours)
 *   ● Identification blockchain requirements (Topic)
 *     ✓ Introduction to blockchain (Subtopic)
 *       Define (Item)
 *       blockchain (Item)
 *       cryptography (Item)
 * 
 * Usage: npx ts-node scripts/rqf-curriculum-parser.ts <pdf-path> <trackId>
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

interface TOCItem {
  id: string;
  type: 'outcome' | 'topic' | 'subtopic' | 'item';
  title: string;
  parentId?: string;
  order: number;
  hours?: number;
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
// PDF TEXT EXTRACTION
// ══════════════════════════════════════════════════════════════════════

function extractPDFText(pdfPath: string): string {
  try {
    const outputPath = '/tmp/curriculum-extract.txt';
    execSync(`pdftotext -layout "${pdfPath}" "${outputPath}"`, { stdio: 'ignore' });
    const text = fs.readFileSync(outputPath, 'utf-8');
    fs.unlinkSync(outputPath);
    return text;
  } catch (error: any) {
    if (error.message?.includes('pdftotext')) {
      console.log('\n⚠️  pdftotext not found!');
      console.log('   Install: sudo apt-get install poppler-utils (Ubuntu/Debian)');
      console.log('   Or: brew install poppler (macOS)\n');
    }
    throw error;
  }
}

// ══════════════════════════════════════════════════════════════════════
// RQF FORMAT PARSER
// ══════════════════════════════════════════════════════════════════════

function parseRQFCurriculum(text: string): ParsedOutcome[] {
  const lines = text.split('\n');
  const outcomes: ParsedOutcome[] = [];
  
  let currentOutcome: ParsedOutcome | null = null;
  let currentTopic: ParsedTopic | null = null;
  let currentSubtopic: ParsedSubtopic | null = null;
  
  let inIndicativeContent = false;
  let indentLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;
    
    // Detect "Indicative content" section start
    if (trimmed.match(/^Indicative\s+content/i)) {
      inIndicativeContent = true;
      console.log('\n📋 Found Indicative Content section\n');
      continue;
    }
    
    // Stop at certain sections
    if (trimmed.match(/^(Learning activities|Assessment|References|Bibliography)/i)) {
      inIndicativeContent = false;
      break;
    }
    
    if (!inIndicativeContent) {
      // Parse Learning Outcome header
      // Format: "Learning outcome 1: Design blockchain system architecture"
      const loMatch = trimmed.match(/^Learning\s+outcome\s+(\d+):\s*(.+?)(?:\s+Learning\s+hours:?\s*(\d+))?$/i);
      if (loMatch) {
        if (currentOutcome) outcomes.push(currentOutcome);
        
        currentOutcome = {
          number: parseInt(loMatch[1]),
          title: loMatch[2].trim(),
          hours: loMatch[3] ? parseInt(loMatch[3]) : 10,
          topics: []
        };
        currentTopic = null;
        currentSubtopic = null;
        console.log(`📘 LO${currentOutcome.number}: ${currentOutcome.title} (${currentOutcome.hours}h)`);
        continue;
      }
      
      // Alternative format: just the hours on next line
      if (trimmed.match(/^Learning\s+hours?:?\s*(\d+)/i) && currentOutcome) {
        const hoursMatch = trimmed.match(/(\d+)/);
        if (hoursMatch) currentOutcome.hours = parseInt(hoursMatch[1]);
        continue;
      }
    }
    
    if (inIndicativeContent && currentOutcome) {
      // Level 2: TOPIC (● bullet)
      if (trimmed.match(/^●\s+/)) {
        const topicTitle = trimmed.replace(/^●\s+/, '').trim();
        
        if (topicTitle.length > 3) {
          if (currentTopic) currentOutcome.topics.push(currentTopic);
          
          currentTopic = {
            title: topicTitle.charAt(0).toUpperCase() + topicTitle.slice(1),
            subtopics: []
          };
          currentSubtopic = null;
          console.log(`  📗 Topic: ${currentTopic.title}`);
        }
        continue;
      }
      
      // Level 3: SUBTOPIC (✓ checkmark)
      if (trimmed.match(/^✓\s+/)) {
        const subtopicTitle = trimmed.replace(/^✓\s+/, '').trim();
        
        if (subtopicTitle.length > 3 && currentTopic) {
          if (currentSubtopic) currentTopic.subtopics.push(currentSubtopic);
          
          currentSubtopic = {
            title: subtopicTitle.charAt(0).toUpperCase() + subtopicTitle.slice(1),
            items: []
          };
          console.log(`    📙 Subtopic: ${currentSubtopic.title}`);
        }
        continue;
      }
      
      // Level 4: ITEMS (plain indented text under subtopic)
      // Items are lines that are indented but don't start with ● or ✓
      if (currentSubtopic && !trimmed.match(/^[●✓]/) && line.match(/^\s{10,}/)) {
        const item = trimmed;
        
        // Filter out noise (very short items, section headers, etc.)
        if (item.length > 2 && 
            !item.match(/^Learning|^Indicative|^Assessment|^Activities/i) &&
            !item.match(/^\d+\.\s*$/) &&
            !item.match(/^[a-z]\)\s*$/i)) {
          
          currentSubtopic.items.push(item.charAt(0).toUpperCase() + item.slice(1));
          console.log(`      📄 Item: ${item}`);
        }
        continue;
      }
    }
  }
  
  // Push final items
  if (currentSubtopic && currentTopic) currentTopic.subtopics.push(currentSubtopic);
  if (currentTopic && currentOutcome) currentOutcome.topics.push(currentTopic);
  if (currentOutcome) outcomes.push(currentOutcome);
  
  return outcomes;
}

// ══════════════════════════════════════════════════════════════════════
// TOC GENERATOR
// ══════════════════════════════════════════════════════════════════════

function generateTOC(outcomes: ParsedOutcome[]): TOCItem[] {
  const toc: TOCItem[] = [];
  let order = 0;
  
  outcomes.forEach((outcome, oIdx) => {
    const outcomeId = `outcome-${oIdx}`;
    
    // Level 1: Outcome
    toc.push({
      id: outcomeId,
      type: 'outcome',
      title: outcome.title,
      order: order++,
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
        order: order++
      });
      
      topic.subtopics.forEach((subtopic, sIdx) => {
        const subtopicId = `subtopic-${oIdx}-${tIdx}-${sIdx}`;
        
        // Level 3: Subtopic
        toc.push({
          id: subtopicId,
          type: 'subtopic',
          title: subtopic.title,
          parentId: topicId,
          order: order++
        });
        
        // Level 4: Items
        subtopic.items.forEach((item, iIdx) => {
          const itemId = `item-${oIdx}-${tIdx}-${sIdx}-${iIdx}`;
          
          toc.push({
            id: itemId,
            type: 'item',
            title: item,
            parentId: subtopicId,
            order: order++
          });
        });
      });
    });
  });
  
  return toc;
}

// ══════════════════════════════════════════════════════════════════════
// STATISTICS & OUTPUT
// ══════════════════════════════════════════════════════════════════════

function printStats(toc: TOCItem[]) {
  const stats = {
    outcomes: toc.filter(t => t.type === 'outcome').length,
    topics: toc.filter(t => t.type === 'topic').length,
    subtopics: toc.filter(t => t.type === 'subtopic').length,
    items: toc.filter(t => t.type === 'item').length
  };
  
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('📊 PARSED CURRICULUM STRUCTURE');
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log(`  ✅ Level 1 (Learning Outcomes): ${stats.outcomes}`);
  console.log(`  ✅ Level 2 (Topics): ${stats.topics}`);
  console.log(`  ✅ Level 3 (Subtopics): ${stats.subtopics}`);
  console.log(`  ✅ Level 4 (Items): ${stats.items} ← EXTRACTED!`);
  console.log(`  📦 Total TOC Entries: ${toc.length}`);
  console.log('══════════════════════════════════════════════════════════════════════\n');
  
  if (stats.items === 0) {
    console.log('⚠️  WARNING: No Level 4 items found!');
    console.log('   Check if "Indicative content" section exists in PDF');
    console.log('   Or items may need different indentation detection\n');
  }
  
  return stats;
}

// ══════════════════════════════════════════════════════════════════════
// DATABASE UPDATE
// ══════════════════════════════════════════════════════════════════════

async function updateDatabase(trackId: string, toc: TOCItem[]) {
  console.log(`💾 Updating database for track: ${trackId}...`);
  
  const track = await prisma.skillTrack.findUnique({
    where: { id: trackId }
  });
  
  if (!track) {
    console.log(`❌ Track not found: ${trackId}`);
    return false;
  }
  
  await prisma.skillTrack.update({
    where: { id: trackId },
    data: { tableOfContents: toc as any }
  });
  
  console.log('✅ Database updated successfully!\n');
  return true;
}

// ══════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('🎓 RQF LEVEL 5 CURRICULUM PARSER');
  console.log('   Extracts ALL 4 LEVELS from curriculum PDFs');
  console.log('══════════════════════════════════════════════════════════════════════\n');
  
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npx ts-node scripts/rqf-curriculum-parser.ts <pdf-path> <trackId>\n');
    console.log('Example:');
    console.log('  npx ts-node scripts/rqf-curriculum-parser.ts \\');
    console.log('    "7 Curriculum/.../SWDBF501 Blockchains Fundamentals.pdf" \\');
    console.log('    seed-track-blockchain-fundamentals\n');
    process.exit(1);
  }
  
  const [pdfPath, trackId] = args;
  const fullPath = path.isAbsolute(pdfPath) ? pdfPath : path.join(process.cwd(), pdfPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ PDF not found: ${fullPath}\n`);
    process.exit(1);
  }
  
  console.log(`📄 PDF: ${path.basename(fullPath)}`);
  console.log(`🎯 Track: ${trackId}\n`);
  
  try {
    // Extract text
    console.log('📖 Step 1: Extracting text from PDF...');
    const text = extractPDFText(fullPath);
    console.log(`   ✅ Extracted ${text.length} characters\n`);
    
    // Parse
    console.log('🔍 Step 2: Parsing RQF curriculum structure...');
    const outcomes = parseRQFCurriculum(text);
    
    if (outcomes.length === 0) {
      console.log('\n❌ No learning outcomes found!');
      console.log('   The PDF may not follow standard RQF format.');
      console.log('   Check the "Indicative content" section exists.\n');
      process.exit(1);
    }
    
    // Generate TOC
    console.log('\n🗂️  Step 3: Generating 4-level TOC...');
    const toc = generateTOC(outcomes);
    
    // Stats
    const stats = printStats(toc);
    
    // Save
    const success = await updateDatabase(trackId, toc);
    
    if (success) {
      // Save JSON for reference
      const moduleCode = path.basename(fullPath).split(' ')[0];
      const outputFile = `parsed-${moduleCode}.json`;
      fs.writeFileSync(outputFile, JSON.stringify({ outcomes, toc, stats }, null, 2));
      
      console.log('══════════════════════════════════════════════════════════════════════');
      console.log('✅ SUCCESS!');
      console.log('══════════════════════════════════════════════════════════════════════');
      console.log(`   📁 Saved to: ${outputFile}`);
      console.log(`   🎨 View at: http://localhost:3001/passport/teach/${trackId}`);
      console.log('══════════════════════════════════════════════════════════════════════\n');
      
      console.log('🚀 Next Steps:');
      console.log(`   1. Refresh the teacher page to see all 4 levels`);
      console.log(`   2. Generate content: npx ts-node scripts/curriculum-aware-content-generator.ts ${trackId} 1`);
      console.log(`   3. Check student page: http://localhost:3001/learn/[module-slug]\n`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
