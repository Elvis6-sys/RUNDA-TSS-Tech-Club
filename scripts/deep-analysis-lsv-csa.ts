#!/usr/bin/env tsx
/**
 * Deep analysis of Land Surveying and CSA curricula
 * to identify all marker variations and structure patterns
 */

import fs from 'fs';
import path from 'path';

const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const testFiles = [
  // LSV samples
  'LSVGM402-APPLY_GIS_IN_MAPPING.pdf',
  'LSVLL502-Land_Law_and_Regulations.pdf',
  'LSVSS501-Surveying of Civil Structures.pdf',
  'LSVMA302-ANGULAR MEASUREMENTS.pdf',
  'LSVAC402-APPLY AUTOCAD',
  'LSVCS502-Cadastral Surveying.pdf',
  // CSA samples  
  'CSAPA301 Assemble PCB',
  'CSACR401',
  'CSACH501 Computer Hardware',
  'CSAPD301 Computer Peripherals',
  'CSACE401',
];

async function analyzeStructure() {
  const uploadDir = path.join(process.cwd(), 'public/uploads/projects');
  const allFiles = fs.readdirSync(uploadDir).filter(f => f.endsWith('.pdf'));
  
  console.log('🔬 DEEP STRUCTURE ANALYSIS\\n');
  
  for (const pattern of testFiles) {
    const file = allFiles.find(f => f.includes(pattern));
    if (!file) {
      console.log(`⚠️  ${pattern}: NOT FOUND\\n`);
      continue;
    }
    
    try {
      const filePath = path.join(uploadDir, file);
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const lines = pdfData.text.split('\\n');
      
      const lo1Idx = lines.findIndex(l => /Learning outcome 1:/i.test(l));
      if (lo1Idx === -1) {
        console.log(`❌ ${pattern}: No LO1 found\\n`);
        continue;
      }
      
      console.log(`📄 ${file.substring(0, 50)}`);
      console.log('   Structure:');
      
      const markers = {
        topics: new Set<number>(),
        subtopics: new Set<number>(),
        items: new Set<number>()
      };
      
      let inIndicative = false;
      let lastTopicLine = -1;
      let lastSubtopicLine = -1;
      
      for (let i = lo1Idx; i < Math.min(lo1Idx + 100, lines.length); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (/Indicative content/i.test(line)) {
          inIndicative = true;
          continue;
        }
        
        if (/Resources required|Facilitation/i.test(line)) break;
        
        if (inIndicative) {
          const firstChar = line.charAt(0);
          const code = firstChar.charCodeAt(0);
          
          // Detect topics (usually ● or • or special chars)
          if (code === 9679 || code === 8226 || code === 61623) {
            markers.topics.add(code);
            lastTopicLine = i;
            lastSubtopicLine = -1;
          }
          // Detect subtopics
          else if (code === 10003 || code === 10004 || code === 252 || code === 10146 || code === 61692) {
            markers.subtopics.add(code);
            lastSubtopicLine = i;
          }
          // Detect items (bullets after subtopics)
          else if (lastSubtopicLine > -1 && i - lastSubtopicLine < 10) {
            if (code === 8226 || line.startsWith(' ')) {
              markers.items.add(code);
            }
          }
        }
      }
      
      console.log(\`   Topics: \${Array.from(markers.topics).map(c => \`\${c}(\${String.fromCharCode(c)})\`).join(', ')}\`);
      console.log(\`   Subtopics: \${Array.from(markers.subtopics).map(c => \`\${c}(\${String.fromCharCode(c)})\`).join(', ')}\`);
      console.log(\`   Items: \${markers.items.size} unique markers\\n\`);
      
    } catch (err: any) {
      console.log(\`❌ ${pattern}: ${err.message}\\n\`);
    }
  }
}

analyzeStructure();
