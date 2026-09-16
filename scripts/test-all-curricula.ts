#!/usr/bin/env tsx
/**
 * Test TOC generation on a diverse sample of curricula
 * to ensure all marker variations are properly detected
 */

import { parseRQFCurriculum } from '../lib/parseRQFCurriculum';
import fs from 'fs';
import path from 'path';

const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const testSamples = [
  'Windows Server Administration 082024',
  'LSVGM402-APPLY_GIS_IN_MAPPING',
  'Land_Law_and_Regulations',
  'Front-End App Development with React.JS',
  'Assemble PCB and computer system',
  'Computer System Refurbishment',
  'BUILDING CONSTRUCTION DRAWING',
  'ArchiCad Software',
];

async function testAll() {
  console.log('🔍 Testing TOC Parser on Diverse Curricula\n');
  
  const uploadDir = path.join(process.cwd(), 'public/uploads/projects');
  const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.pdf'));
  
  let passCount = 0;
  let failCount = 0;
  
  for (const sampleName of testSamples) {
    const file = files.find(f => f.includes(sampleName));
    if (!file) {
      console.log(`⚠️  ${sampleName}: FILE NOT FOUND`);
      continue;
    }
    
    try {
      const filePath = path.join(uploadDir, file);
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      const toc = parseRQFCurriculum(pdfData.text, sampleName);
      
      if (!toc || toc.length === 0) {
        console.log(`❌ ${sampleName}: NO TOC GENERATED`);
        failCount++;
        continue;
      }
      
      const outcomes = toc.filter(t => t.type === 'outcome');
      const topics = toc.filter(t => t.type === 'topic');
      const subtopics = toc.filter(t => t.type === 'subtopic');
      
      if (outcomes.length === 0) {
        console.log(`❌ ${sampleName}: No outcomes found`);
        failCount++;
        continue;
      }
      
      const hasTopics = topics.length > 0;
      const hasSubtopics = subtopics.length > 0;
      
      console.log(`✅ ${sampleName}`);
      console.log(`   ${outcomes.length} LOs, ${topics.length} topics, ${subtopics.length} subtopics`);
      
      if (!hasTopics) {
        console.log(`   ⚠️  Warning: No topics found`);
      }
      
      passCount++;
      
    } catch (err: any) {
      console.log(`❌ ${sampleName}: ${err.message}`);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(60));
}

testAll();
