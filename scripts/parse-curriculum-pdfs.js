/**
 * Curriculum PDF Parser - Using pdfjs-dist
 * Extracts content from TVET curriculum PDFs and converts to JSON
 * for AI consumption
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if pdfjs-dist is installed
try {
  require('pdfjs-dist/legacy/build/pdf.js');
} catch (e) {
  console.log('📦 Installing pdfjs-dist...');
  execSync('npm install pdfjs-dist canvas', { stdio: 'inherit' });
}

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const CURRICULUM_DIR = path.join(__dirname, '../public/curriculum');
const OUTPUT_DIR = path.join(__dirname, '../lib/curriculum-data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse a single PDF file using pdfjs-dist
 */
async function parsePDF(pdfPath) {
  console.log(`\n📄 Parsing: ${path.basename(pdfPath)}`);

  const dataBuffer = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({
    data: dataBuffer,
    verbosity: 0
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  let fullText = '';

  // Extract text from each page
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return {
    text: fullText,
    pages: numPages
  };
}

/**
 * Extract module information from PDF text
 */
function extractModuleInfo(text, filename) {
  const moduleCode = filename.match(/([A-Z]{3,}[A-Z0-9]+)/)?.[1] || 'UNKNOWN';

  // Extract module title - clean up common patterns
  let title = filename.replace(/\.pdf$/i, '').replace(moduleCode, '').trim();
  title = title.replace(/^[\s\-_]+/, '').replace(/[\s\-_]+$/, '');

  // Try to find a better title in the text
  const titlePatterns = [
    new RegExp(`${moduleCode}[\\s:\\-]+([^\\n]{10,100})`, 'i'),
    /Module Title[:\s]+([^\n]{10,100})/i,
    /Course[:\s]+([^\n]{10,100})/i
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 5) {
      title = match[1].trim();
      break;
    }
  }

  // Extract learning outcomes
  const learningOutcomes = extractLearningOutcomes(text);

  // Extract description
  const description = extractDescription(text);

  // Extract indicative content
  const indicativeContent = extractIndicativeContent(text);

  return {
    code: moduleCode,
    title: title,
    description: description,
    learningOutcomes: learningOutcomes.length > 0 ? learningOutcomes : null,
    indicativeContent: indicativeContent.length > 0 ? indicativeContent : null,
    rawText: text.substring(0, 10000) // First 10000 chars for reference
  };
}

/**
 * Extract learning outcomes with their topics
 */
function extractLearningOutcomes(text) {
  const outcomes = [];

  // Pattern 1: "Learning Outcome X: Title"
  const loPattern1 = /Learning\s+Outcome\s+(\d+)[:\s]+([^\n]{10,200})/gi;
  const matches1 = [...text.matchAll(loPattern1)];

  // Pattern 2: "LO X: Title" or "LO X. Title"
  const loPattern2 = /\bLO[\s\.]*(\d+)[:\.\s]+([^\n]{10,200})/gi;
  const matches2 = [...text.matchAll(loPattern2)];

  // Pattern 3: Numbered outcomes in structure
  const loPattern3 = /(?:^|\n)\s*(\d+)[\.\)]\s+([A-Z][^\n]{20,200})/gm;
  const matches3 = [...text.matchAll(loPattern3)];

  // Combine all matches
  const allMatches = [...matches1, ...matches2];

  // Deduplicate by number
  const seen = new Set();

  for (const match of allMatches) {
    const number = parseInt(match[1]);
    if (seen.has(number) || number > 20) continue; // Skip duplicates and unrealistic numbers

    seen.add(number);

    const outcomeTitle = match[2].trim()
      .replace(/\s+/g, ' ')
      .replace(/[:\.]$/, '');

    // Extract topics for this outcome
    const topics = extractTopicsForOutcome(text, number, outcomeTitle);

    outcomes.push({
      number,
      title: outcomeTitle,
      topics
    });
  }

  // Sort by number
  outcomes.sort((a, b) => a.number - b.number);

  return outcomes;
}

/**
 * Extract topics for a specific learning outcome
 */
function extractTopicsForOutcome(text, outcomeNumber, outcomeTitle) {
  const topics = [];

  // Find the section for this learning outcome
  const loRegex = new RegExp(
    `Learning\\s+Outcome\\s+${outcomeNumber}[\\s\\S]{0,2000}?(?=Learning\\s+Outcome\\s+${outcomeNumber + 1}|Indicative\\s+Content|Assessment|$)`,
    'i'
  );

  let section = text.match(loRegex)?.[0] || '';

  // If not found, try with LO
  if (!section) {
    const loRegex2 = new RegExp(
      `LO\\s*${outcomeNumber}[\\s\\S]{0,2000}?(?=LO\\s*${outcomeNumber + 1}|Indicative\\s+Content|Assessment|$)`,
      'i'
    );
    section = text.match(loRegex2)?.[0] || '';
  }

  if (section) {
    // Extract bullet points
    const bulletRegex = /[•\-\*○]\s*([^\n]{10,300})/g;
    const bullets = [...section.matchAll(bulletRegex)];

    for (const match of bullets) {
      const topic = match[1].trim().replace(/\s+/g, ' ');
      if (topic.length > 10 && topic.length < 300 && !topic.match(/^(Page|Learning|Outcome)/i)) {
        topics.push(topic);
      }
    }

    // Extract numbered sub-items
    const numberedRegex = /(?:^|\n)\s*\d+[\.\)]\s*([A-Z][^\n]{15,300})/g;
    const numbered = [...section.matchAll(numberedRegex)];

    for (const match of numbered) {
      const topic = match[1].trim().replace(/\s+/g, ' ');
      if (topic.length > 15 && topic.length < 300 && !topics.includes(topic)) {
        topics.push(topic);
      }
    }
  }

  return topics;
}

/**
 * Extract indicative content sections
 */
function extractIndicativeContent(text) {
  const content = [];

  // Look for "Indicative Content" section
  const indicativeRegex = /Indicative\s+Content[:\s]+([\s\S]{0,3000}?)(?=Learning\s+Outcome|Assessment|Module|$)/i;
  const match = text.match(indicativeRegex);

  if (match) {
    const section = match[1];

    // Extract numbered items
    const numberedRegex = /(?:^|\n)\s*(\d+)[\.\)]\s*([^\n]{10,300})/g;
    const items = [...section.matchAll(numberedRegex)];

    for (const item of items) {
      const number = parseInt(item[1]);
      const contentText = item[2].trim().replace(/\s+/g, ' ');

      if (contentText.length > 10) {
        content.push({
          number,
          text: contentText
        });
      }
    }

    // If no numbered items, try bullet points
    if (content.length === 0) {
      const bulletRegex = /[•\-\*]\s*([^\n]{10,300})/g;
      const bullets = [...section.matchAll(bulletRegex)];

      bullets.forEach((bullet, index) => {
        const contentText = bullet[1].trim().replace(/\s+/g, ' ');
        if (contentText.length > 10) {
          content.push({
            number: index + 1,
            text: contentText
          });
        }
      });
    }
  }

  return content;
}

/**
 * Extract module description
 */
function extractDescription(text) {
  // Look for description patterns
  const patterns = [
    /Description[:\s]+([^\n]{50,500})/i,
    /Introduction[:\s]+([^\n]{50,500})/i,
    /Overview[:\s]+([^\n]{50,500})/i,
    /This\s+module[^\n]{50,500}/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const desc = (match[1] || match[0]).trim().replace(/\s+/g, ' ');
      if (desc.length >= 50) {
        return desc;
      }
    }
  }

  return '';
}

/**
 * Process all PDFs in a directory
 */
async function processDirectory(dir, level) {
  const levelName = `L${level}`;
  console.log(`\n🗂️  Processing ${levelName} curriculum...`);

  const specificModulesDir = path.join(dir, levelName, 'Specific Modules');

  if (!fs.existsSync(specificModulesDir)) {
    console.log(`⚠️  Directory not found: ${specificModulesDir}`);
    return [];
  }

  const files = fs.readdirSync(specificModulesDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  console.log(`📚 Found ${pdfFiles.length} PDF files`);

  const modules = [];

  for (const file of pdfFiles) {
    try {
      const pdfPath = path.join(specificModulesDir, file);
      const pdfData = await parsePDF(pdfPath);
      const moduleInfo = extractModuleInfo(pdfData.text, file);

      modules.push({
        ...moduleInfo,
        sourceFile: file,
        pages: pdfData.pages,
        level: levelName
      });

      console.log(`  ✅ ${moduleInfo.code}: ${moduleInfo.title}`);
      if (moduleInfo.learningOutcomes) {
        console.log(`     📖 ${moduleInfo.learningOutcomes.length} learning outcomes extracted`);
        moduleInfo.learningOutcomes.forEach(lo => {
          if (lo.topics.length > 0) {
            console.log(`        LO${lo.number}: ${lo.topics.length} topics`);
          }
        });
      }

    } catch (error) {
      console.error(`  ❌ Error parsing ${file}:`, error.message);
    }
  }

  return modules;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 TVET Curriculum Parser Starting...\n');
  console.log('═══════════════════════════════════════════════════\n');

  const allModules = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalModules: 0,
      levels: []
    },
    L3: [],
    L4: [],
    L5: []
  };

  // Process each level
  for (const level of [3, 4, 5]) {
    const modules = await processDirectory(CURRICULUM_DIR, level);
    allModules[`L${level}`] = modules;
    allModules.metadata.totalModules += modules.length;

    if (modules.length > 0) {
      allModules.metadata.levels.push(`L${level}`);

      // Save individual level file
      const levelFile = path.join(OUTPUT_DIR, `curriculum-l${level}.json`);
      fs.writeFileSync(
        levelFile,
        JSON.stringify(modules, null, 2)
      );
      console.log(`\n💾 Saved: ${levelFile}`);
    }
  }

  // Save combined file
  const combinedFile = path.join(OUTPUT_DIR, 'curriculum-all.json');
  fs.writeFileSync(
    combinedFile,
    JSON.stringify(allModules, null, 2)
  );

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ Parsing Complete!\n');
  console.log(`📊 Total modules parsed: ${allModules.metadata.totalModules}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`📄 Combined file: curriculum-all.json`);
  console.log(`📄 Level files: curriculum-l3.json, curriculum-l4.json, curriculum-l5.json`);

  // Generate TypeScript types
  generateTypeScriptTypes(allModules);

  console.log('\n🎉 Ready to use! Import in your code:');
  console.log('   import curriculum from "@/lib/curriculum-data/curriculum-all.json"');
  console.log('\n📖 To view SWDBF501 Blockchain curriculum:');
  console.log('   cat lib/curriculum-data/curriculum-l5.json | grep -A 50 "SWDBF501"');
}

/**
 * Generate TypeScript type definitions
 */
function generateTypeScriptTypes(data) {
  const types = `/**
 * Auto-generated TypeScript types for curriculum data
 * Generated: ${new Date().toISOString()}
 */

export interface CurriculumTopic {
  text: string;
}

export interface LearningOutcome {
  number: number;
  title: string;
  topics: string[];
}

export interface IndicativeContent {
  number: number;
  text: string;
}

export interface Module {
  code: string;
  title: string;
  description: string;
  learningOutcomes: LearningOutcome[] | null;
  indicativeContent: IndicativeContent[] | null;
  rawText: string;
  sourceFile: string;
  pages: number;
  level: string;
}

export interface CurriculumData {
  metadata: {
    generatedAt: string;
    totalModules: number;
    levels: string[];
  };
  L3: Module[];
  L4: Module[];
  L5: Module[];
}
`;

  const typesFile = path.join(OUTPUT_DIR, 'curriculum-types.ts');
  fs.writeFileSync(typesFile, types);
  console.log(`\n📘 Generated TypeScript types: ${typesFile}`);
}

// Run parser
main().catch(console.error);
