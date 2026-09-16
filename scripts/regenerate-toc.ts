/**
 * Regenerate TOC for specific modules
 */
import { prisma } from '../lib/prisma';
import { parseRQFCurriculum } from '../lib/parseRQFCurriculum';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const pdfParse = require('pdf-parse/lib/pdf-parse.js');

async function regenerateTOC(moduleCode: string) {
  console.log(`\n=== Regenerating TOC for ${moduleCode} ===`);

  // Find module
  const module = await prisma.curriculumModule.findUnique({
    where: { code: moduleCode },
  });

  if (!module) {
    console.error(`Module ${moduleCode} not found`);
    return;
  }

  console.log(`Found module: ${module.name}`);
  console.log(`PDF path: ${module.pdfPath}`);

  // Find track
  const track = await prisma.skillTrack.findFirst({
    where: { moduleSlug: moduleCode.toLowerCase() },
  });

  if (!track) {
    console.error(`No track found for module ${moduleCode}`);
    return;
  }

  console.log(`Found track: ${track.id}`);

  // Read PDF
  const relativePath = module.pdfPath.startsWith('/')
    ? module.pdfPath.substring(1)
    : module.pdfPath;

  const basePath = process.cwd();
  const pdfFullPath = path.join(basePath, relativePath);

  console.log(`Reading PDF from: ${pdfFullPath}`);
  console.log(`File exists: ${existsSync(pdfFullPath)}`);

  if (!existsSync(pdfFullPath)) {
    console.error(`PDF not found at: ${pdfFullPath}`);
    return;
  }

  const buffer = await fs.readFile(pdfFullPath);
  const pdfData = await pdfParse(buffer);
  const text = pdfData.text;

  console.log(`Extracted ${text.length} characters from PDF`);

  // Parse curriculum
  const toc = parseRQFCurriculum(text, module.name);

  if (!toc || toc.length === 0) {
    console.error(`TOC parsing failed - no items returned`);
    return;
  }

  console.log(`Parsed TOC: ${toc.length} items`);

  // Count by type
  const outcomes = toc.filter(t => t.type === 'outcome');
  const topics = toc.filter(t => t.type === 'topic');
  const subtopics = toc.filter(t => t.type === 'subtopic');
  const totalItems = subtopics.reduce((sum, s) => sum + (s.items?.length || 0), 0);

  console.log(`  - ${outcomes.length} outcomes`);
  console.log(`  - ${topics.length} topics`);
  console.log(`  - ${subtopics.length} subtopics`);
  console.log(`  - ${totalItems} items`);

  // Update database
  await prisma.skillTrack.update({
    where: { id: track.id },
    data: { tableOfContents: JSON.stringify(toc) },
  });

  console.log(`✅ TOC updated successfully for ${moduleCode}`);
}

async function main() {
  const modules = ['SWDWS401', 'SWDPR301'];

  for (const moduleCode of modules) {
    try {
      await regenerateTOC(moduleCode);
    } catch (error) {
      console.error(`Error regenerating TOC for ${moduleCode}:`, error);
    }
  }

  console.log('\n=== Done ===');
  await prisma.$disconnect();
}

main().catch(console.error);
