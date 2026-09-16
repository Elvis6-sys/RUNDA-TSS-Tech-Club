/**
 * Comprehensive test of LSV and CSA module parsing
 * Tests all critical modules to ensure perfect TOC generation
 */

const pdf = require('pdf-parse/lib/pdf-parse.js');
const fs = require('fs');
const path = require('path');

// Import the parser - use require with .ts extension
const parser = require('../lib/parseRQFCurriculum.ts');

const testModules = [
  // BDC - The problematic one with • for both topics and items
  { pattern: 'BDCBD501', name: 'Reinforced Concrete Design (BDC L5)' },
  // LSV L4
  { pattern: 'LSVGM402-APPLY_GIS', name: 'GIS Mapping (LSV L4)' },
  { pattern: 'LSVAC402-APPLY AUTOCAD', name: 'AutoCAD/Covadis (LSV L4)' },
  { pattern: 'LSVSC402-PERFORM BASIC', name: 'Survey Computation (LSV L4)' },
  // LSV L5
  { pattern: 'LSVLL502-Land_Law', name: 'Land Law (LSV L5)' },
  { pattern: 'LSVSS501-Surveying of Civil', name: 'Civil Structures (LSV L5)' },
  { pattern: 'LSVCS502-Cadastral', name: 'Cadastral Surveying (LSV L5)' },
  { pattern: 'LSVHS501-Hydrographic', name: 'Hydrographic Surveying (LSV L5)' },
  // CSA L3
  { pattern: 'CSAPA301 Assemble PCB', name: 'Assemble PCB (CSA L3)' },
  { pattern: 'CSACI301 Electronic Circuit', name: 'Electronic Circuit (CSA L3)' },
  // CSA L4
  { pattern: 'CSACR401', name: 'Computer Refurbishment (CSA L4)' },
  { pattern: 'CSACE401', name: 'Electronics Enclosure (CSA L4)' },
  { pattern: 'CSAES401', name: 'Embedded System (CSA L4)' },
  // CSA L5
  { pattern: 'CSACH501 Computer Hardware', name: 'Hardware Architecture (CSA L5)' },
  { pattern: 'CSAWS501', name: 'Windows Server (CSA L5)' },
  { pattern: 'CSAHK501 HOBBY KERNEL', name: 'Hobby Kernel (CSA L5)' },
];

const uploadDir = path.join(__dirname, '../public/uploads/projects');

async function testAll() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE LSV & CSA CURRICULUM PARSING TEST             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const allFiles = fs.readdirSync(uploadDir).filter(f => f.endsWith('.pdf'));
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of testModules) {
    const file = allFiles.find(f => f.includes(test.pattern));
    
    if (!file) {
      console.log(`❌ ${test.name}`);
      console.log(`   FILE NOT FOUND: ${test.pattern}\n`);
      failed++;
      failures.push({ name: test.name, reason: 'File not found' });
      continue;
    }

    try {
      const filePath = path.join(uploadDir, file);
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      const toc = parser.parseRQFCurriculum(data.text, test.name);
      
      if (!toc || toc.length === 0) {
        console.log(`❌ ${test.name}`);
        console.log(`   PARSING FAILED: No TOC items generated\n`);
        failed++;
        failures.push({ name: test.name, reason: 'No TOC items' });
        continue;
      }

      const outcomes = toc.filter(t => t.type === 'outcome');
      const topics = toc.filter(t => t.type === 'topic');
      const subtopics = toc.filter(t => t.type === 'subtopic');
      const withItems = subtopics.filter(s => s.items && s.items.length > 0);

      // Validation checks
      const hasLOs = outcomes.length >= 2;
      const hasTopics = topics.length > 0;
      const hasSubtopics = subtopics.length > 0;
      const hasItems = withItems.length > 0;
      
      const allChecks = hasLOs && hasTopics && hasSubtopics && hasItems;

      if (allChecks) {
        console.log(`✅ ${test.name}`);
        console.log(`   LOs: ${outcomes.length} | Topics: ${topics.length} | Subtopics: ${subtopics.length} | With items: ${withItems.length}`);
        if (withItems[0]) {
          console.log(`   Sample: "${withItems[0].title}" → ${withItems[0].items.length} items`);
        }
        console.log('');
        passed++;
      } else {
        console.log(`⚠️  ${test.name}`);
        console.log(`   LOs: ${outcomes.length} | Topics: ${topics.length} | Subtopics: ${subtopics.length} | With items: ${withItems.length}`);
        console.log(`   Missing: ${!hasLOs ? 'LOs ' : ''}${!hasTopics ? 'Topics ' : ''}${!hasSubtopics ? 'Subtopics ' : ''}${!hasItems ? 'Items' : ''}`);
        console.log('');
        failed++;
        failures.push({ 
          name: test.name, 
          reason: `Missing: ${!hasLOs ? 'LOs ' : ''}${!hasTopics ? 'Topics ' : ''}${!hasSubtopics ? 'Subtopics ' : ''}${!hasItems ? 'Items' : ''}`
        });
      }

    } catch (err) {
      console.log(`❌ ${test.name}`);
      console.log(`   ERROR: ${err.message}\n`);
      failed++;
      failures.push({ name: test.name, reason: err.message });
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`RESULTS: ${passed}/${testModules.length} passed, ${failed} failed`);
  
  if (failures.length > 0) {
    console.log('\n❌ FAILURES:');
    failures.forEach(f => {
      console.log(`   - ${f.name}: ${f.reason}`);
    });
  } else {
    console.log('\n🎉 ALL TESTS PASSED! Parser is ready for production.');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
}

testAll().catch(console.error);
