#!/usr/bin/env ts-node
/**
 * CURRICULUM PDF EXTRACTOR
 * 
 * Extracts full text content from all 249 curriculum PDFs
 * Creates searchable index for RAG (Retrieval-Augmented Generation)
 * 
 * Output: lib/curriculum-data/curriculum-content-index.json
 */

import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

// Types
interface PDFContent {
  moduleCode: string;
  title: string;
  department: string;
  level: string;
  filePath: string;
  fileName: string;
  pages: PageContent[];
  fullText: string;
  wordCount: number;
  topics: string[];
}

interface PageContent {
  pageNumber: number;
  text: string;
}

interface CurriculumIndex {
  metadata: {
    extractedAt: string;
    totalPDFs: number;
    totalPages: number;
    totalWords: number;
    departments: string[];
  };
  modules: PDFContent[];
}

// Configuration
const CURRICULUM_ROOT = path.join(__dirname, '..', 'All Curriculums');
const OUTPUT_FILE = path.join(__dirname, '..', 'lib', 'curriculum-data', 'curriculum-content-index.json');

const DEPARTMENTS = [
  'SOFTWARE DEVELOPMENT',
  'COMPUTER SYSTEM AND ARCHITECTURE',
  'LAND SURVEYING',
  'BUILDING CONSTRUCTION'
];

// Module code extraction regex
const MODULE_CODE_PATTERNS = [
  /([A-Z]{3,6}\d{3,4})/g,           // e.g., SWDBF501, GENFA402
  /([A-Z]{3,4}[A-Z]{2}\d{3})/g,     // e.g., SWDBD401
  /RQF\s+LEVEL\s+(\d)/i,            // Extract level
];

/**
 * Extract module code from filename or content
 */
function extractModuleCode(fileName: string, content: string): string | null {
  // Try filename first
  for (const pattern of MODULE_CODE_PATTERNS) {
    const match = fileName.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  // Try first 1000 chars of content
  const preview = content.substring(0, 1000);
  for (const pattern of MODULE_CODE_PATTERNS) {
    const match = preview.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Extract level from path or filename
 */
function extractLevel(filePath: string): string {
  if (filePath.includes('LEVEL 3') || filePath.includes('L3')) return 'L3';
  if (filePath.includes('LEVEL 4') || filePath.includes('L4')) return 'L4';
  if (filePath.includes('LEVEL 5') || filePath.includes('L5')) return 'L5';
  return 'Unknown';
}

/**
 * Extract key topics from text (simple keyword extraction)
 */
function extractTopics(text: string): string[] {
  const keywords = [
    'blockchain', 'solidity', 'smart contract', 'ethereum', 'frontend', 'backend',
    'database', 'sql', 'javascript', 'typescript', 'react', 'nextjs',
    'programming', 'algorithm', 'data structure', 'networking', 'security',
    'web development', 'mobile development', 'cloud computing', 'devops',
    'machine learning', 'artificial intelligence', 'iot', 'embedded systems',
    'hardware', 'software', 'architecture', 'design pattern', 'testing',
    'land surveying', 'geodesy', 'gis', 'cartography', 'topography',
    'building construction', 'civil engineering', 'structural', 'concrete',
    'mathematics', 'physics', 'english', 'french', 'kinyarwanda'
  ];

  const lowerText = text.toLowerCase();
  const found: string[] = [];

  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      found.push(keyword);
    }
  }

  return Array.from(new Set(found)); // Remove duplicates
}

/**
 * Extract text from a single PDF
 */
async function extractPDF(filePath: string, department: string): Promise<PDFContent | null> {
  try {
    console.log(`  📄 Processing: ${path.basename(filePath)}`);

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const fullText = data.text;
    const fileName = path.basename(filePath);
    const level = extractLevel(filePath);
    const moduleCode = extractModuleCode(fileName, fullText) || `UNKNOWN_${Date.now()}`;

    // Extract title from filename (clean up)
    let title = fileName
      .replace('.pdf', '')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Try to extract cleaner title from content
    const lines = fullText.split('\n').slice(0, 10);
    for (const line of lines) {
      if (line.length > 10 && line.length < 100 && !line.includes('©')) {
        if (line.match(/^[A-Z][A-Za-z\s]{10,}/)) {
          title = line.trim();
          break;
        }
      }
    }

    // Split into pages (approximate)
    const avgCharsPerPage = 2000;
    const pageCount = Math.ceil(fullText.length / avgCharsPerPage);
    const pages: PageContent[] = [];

    for (let i = 0; i < pageCount; i++) {
      const start = i * avgCharsPerPage;
      const end = Math.min((i + 1) * avgCharsPerPage, fullText.length);
      const pageText = fullText.substring(start, end);

      if (pageText.trim().length > 50) { // Skip near-empty pages
        pages.push({
          pageNumber: i + 1,
          text: pageText
        });
      }
    }

    const wordCount = fullText.split(/\s+/).length;
    const topics = extractTopics(fullText);

    return {
      moduleCode,
      title,
      department,
      level,
      filePath: filePath.replace(path.join(__dirname, '..'), ''), // Relative path
      fileName,
      pages,
      fullText,
      wordCount,
      topics
    };

  } catch (error) {
    console.error(`  ❌ Failed to extract ${path.basename(filePath)}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Find all PDF files recursively
 */
function findAllPDFs(dir: string): string[] {
  const pdfs: string[] = [];

  function scan(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        pdfs.push(fullPath);
      }
    }
  }

  scan(dir);
  return pdfs;
}

/**
 * Main extraction function
 */
async function main() {
  console.log('🚀 RUNDA TSS AI - Curriculum PDF Extraction');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allModules: PDFContent[] = [];
  let totalPages = 0;
  let totalWords = 0;

  for (const department of DEPARTMENTS) {
    const deptPath = path.join(CURRICULUM_ROOT, department);

    if (!fs.existsSync(deptPath)) {
      console.log(`⚠️  Skipping ${department} (not found)`);
      continue;
    }

    console.log(`\n📂 Processing: ${department}`);
    console.log('─────────────────────────────────────────────');

    const pdfs = findAllPDFs(deptPath);
    console.log(`  Found ${pdfs.length} PDF files\n`);

    let processed = 0;
    let failed = 0;

    for (const pdf of pdfs) {
      const content = await extractPDF(pdf, department);

      if (content) {
        allModules.push(content);
        totalPages += content.pages.length;
        totalWords += content.wordCount;
        processed++;
      } else {
        failed++;
      }

      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n  ✅ Processed: ${processed}`);
    if (failed > 0) {
      console.log(`  ❌ Failed: ${failed}`);
    }
  }

  // Create index
  const index: CurriculumIndex = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalPDFs: allModules.length,
      totalPages,
      totalWords,
      departments: DEPARTMENTS
    },
    modules: allModules
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ EXTRACTION COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 Statistics:`);
  console.log(`   Total PDFs: ${index.metadata.totalPDFs}`);
  console.log(`   Total Pages: ${index.metadata.totalPages.toLocaleString()}`);
  console.log(`   Total Words: ${index.metadata.totalWords.toLocaleString()}`);
  console.log(`\n💾 Output: ${OUTPUT_FILE}`);
  console.log(`   Size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
  console.log('\n🎯 Ready for RAG integration!\n');
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
